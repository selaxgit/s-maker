import { DestroyOptions, FederatedPointerEvent, RendererDestroyOptions } from 'pixi.js';
import { Subject } from 'rxjs';

import { SceneLayerTypeEnum } from '~core/constants';
import { ISceneLayer } from '~core/interfaces';
import { AppPixiStateEnum } from '~pixijs/interfaces';
import { PixiApp } from '~pixijs/pixi.app';

import { SBDrawSceneService } from '../../services';
import { BaseLayerContainer } from './base-layer.container';
import { BaseObjectContainer } from './base-object.container';
import { LAYER_EVENTS_COLOR, LAYER_GROUND_COLOR } from './constants';
import { ISceneObjectChange, ISceneObjectSelected } from './interfaces';
import { LayerEventsGroundContainer } from './layers/layer-events-ground.container';
import { LayerFramesContainer } from './layers/layer-frames.container';
import { LayerGridContainer } from './layers/layer-grid.container';
import { LayerSpritesContainer } from './layers/layer-sprites.container';

export interface ISceneSpritePlayChanged {
  guidLayer: string;
  guidObject: string;
  playing: boolean;
}

export class ScenePixiApp extends PixiApp {
  readonly sceneObjectChange$ = new Subject<ISceneObjectChange>();

  readonly sceneObjectSelected$ = new Subject<ISceneObjectSelected>();

  readonly sceneSpritePlayChanged$ = new Subject<ISceneSpritePlayChanged>();

  readonly selectedWidthHeightText$ = new Subject<string | null>();

  private readonly layers = new Map<string, BaseLayerContainer>();

  private objectAtCursor: BaseObjectContainer | null = null;

  private ordersLayersKeys: string[] = [];

  constructor(private readonly drawSceneService: SBDrawSceneService) {
    super();
  }

  override destroy(rendererDestroyOptions: RendererDestroyOptions = false, options: DestroyOptions = false): void {
    for (const layer of this.layers.values()) {
      layer.destroy();
    }
    this.layers.clear();
    super.destroy(rendererDestroyOptions, options);
  }

  selectedObject(guidLayer: string | null, guidObject: string | null): void {
    let selectedObjectText: string | null = null;
    for (const [guid, layer] of this.layers.entries()) {
      const object = layer.selectObject(guid === guidLayer ? guidObject : null);
      if (guidObject) {
        if (object && ![SceneLayerTypeEnum.Events, SceneLayerTypeEnum.Grounds].includes(layer.typeLayer)) {
          selectedObjectText = `Ширина/высота объекта: ${object.getWidth()}x${object.getHeight()}`;
        }
      } else if (layer.guidLayer === guidLayer && layer.visible) {
        selectedObjectText = `Ширина высота слоя: ${layer.width}x${layer.height}`;
      }
    }
    this.selectedWidthHeightText$.next(selectedObjectText);
  }

  async drawLayers(layers: ISceneLayer[]): Promise<void> {
    let changeOrdersLayers = this.layers.size === 0;
    // Удаление слоев, которых нет в новом списке
    const layersGuids = layers.map((l: ISceneLayer) => l.guid);
    for (const [guid, layer] of this.layers.entries()) {
      if (!layersGuids.includes(guid)) {
        this.layers.delete(guid);
        layer.destroy();
        changeOrdersLayers = true;
      }
    }
    for (const layerInfo of layers) {
      let layerContainer = this.layers.get(layerInfo.guid);
      if (!layerContainer) {
        changeOrdersLayers = true;
        switch (layerInfo.type) {
          case SceneLayerTypeEnum.Grids:
            layerContainer = new LayerGridContainer(layerInfo.type, layerInfo.guid, this.drawSceneService);
            break;
          case SceneLayerTypeEnum.Events:
            layerContainer = new LayerEventsGroundContainer(layerInfo.type, layerInfo.guid, LAYER_EVENTS_COLOR);
            break;
          case SceneLayerTypeEnum.Grounds:
            layerContainer = new LayerEventsGroundContainer(layerInfo.type, layerInfo.guid, LAYER_GROUND_COLOR);
            break;
          case SceneLayerTypeEnum.Sprites:
            layerContainer = new LayerSpritesContainer(layerInfo.type, layerInfo.guid, this.drawSceneService);
            (layerContainer as LayerSpritesContainer).onSpritePlayChanged = (
              guidLayer: string,
              guidObject: string,
              playing: boolean,
            ) => {
              this.sceneSpritePlayChanged$.next({ guidLayer, guidObject, playing });
            };
            break;
          case SceneLayerTypeEnum.Frames:
            layerContainer = new LayerFramesContainer(layerInfo.type, layerInfo.guid, this.drawSceneService);
            break;
          default:
            console.error(`Не известный тип слоя: ${layerInfo.type}`);
            continue;
        }
        this.layers.set(layerInfo.guid, layerContainer);
        this.viewport.addChild(layerContainer);
      }
      if (layerContainer.zIndex !== layerInfo.zIndex) {
        changeOrdersLayers = true;
      }
      layerContainer.x = layerInfo.x;
      layerContainer.y = layerInfo.y;
      layerContainer.zIndex = layerInfo.zIndex;
      layerContainer.visible = layerInfo.visible;
      if (layerContainer.visible) {
        await layerContainer.drawLayer(layerInfo);
      }
    }
    if (changeOrdersLayers) {
      this.ordersLayersKeys = [...this.layers.values()]
        .sort((a: BaseLayerContainer, b: BaseLayerContainer) => b.zIndex - a.zIndex)
        .map((item: BaseLayerContainer) => item.guidLayer);
    }
  }

  protected override onPointerDown(e: FederatedPointerEvent): void {
    super.onPointerDown(e);
    switch (this.state) {
      case AppPixiStateEnum.DragObject:
      case AppPixiStateEnum.Info:
        this.objectAtCursor = this.getObjectAtCursor(e);
        if (this.objectAtCursor) {
          switch (this.state) {
            case AppPixiStateEnum.DragObject: {
              this.objectAtCursor.captureObject = true;
              this.sendSceneObjectSelected(this.objectAtCursor);
              const point = e.getLocalPosition(this.viewport);
              this._dragStart = {
                mouseX: point.x,
                mouseY: point.y,
                objectX: this.objectAtCursor.getX(),
                objectY: this.objectAtCursor.getY(),
                objectWidth: this.objectAtCursor.getWidth(),
                objectHeight: this.objectAtCursor.getHeight(),
              };
              break;
            }
            case AppPixiStateEnum.Info:
              this.sendSceneObjectSelected(this.objectAtCursor);
              break;
          }
        }
        break;
    }
  }

  protected override onPointerMove(e: FederatedPointerEvent): void {
    super.onPointerMove(e);
    if (this.state === AppPixiStateEnum.DragObject) {
      if (!this._isDragging) {
        this.getObjectCursor(e);
      }
      if (this.objectAtCursor && this._isDragging) {
        this.dragObject(e);
      }
    }
  }

  protected override onPointerUp(): void {
    super.onPointerUp();
    if (this.objectAtCursor) {
      this.objectAtCursor.captureObject = false;
    }
    if (this.objectAtCursor && this._state === AppPixiStateEnum.DragObject) {
      this.sendSceneObjectChange(this.objectAtCursor);
      this.objectAtCursor = null;
    }
  }

  protected override onPointerLeave(): void {
    if (this.objectAtCursor) {
      this.objectAtCursor.captureObject = false;
    }
    if (this._dragStart && this.objectAtCursor && this._state === AppPixiStateEnum.DragObject) {
      this.objectAtCursor.setX(this._dragStart.objectX);
      this.objectAtCursor.setY(this._dragStart.objectY);
      this.objectAtCursor.setWidth(this._dragStart.objectWidth);
      this.objectAtCursor.setHeight(this._dragStart.objectHeight);
      this.sendSceneObjectChange(this.objectAtCursor);
      this.objectAtCursor = null;
    }
    super.onPointerLeave();
  }

  private getObjectCursor(e: FederatedPointerEvent): void {
    let cursor = 'alias';
    for (const guid of this.ordersLayersKeys) {
      const layer = this.layers.get(guid);
      if (layer) {
        const object = layer.getObjectAtCursor(e);
        if (object) {
          cursor = object.objectCursor ?? 'move';
          break;
        }
      }
    }
    this.canvas.style.cursor = cursor;
  }

  private dragObject(e: FederatedPointerEvent): void {
    if (this._dragStart && this.objectAtCursor) {
      const point = e.getLocalPosition(this.viewport);
      const dx = point.x - this._dragStart.mouseX;
      const dy = point.y - this._dragStart.mouseY;
      this.objectAtCursor.dragObject(dx, dy, this._dragStart);
    }
  }

  private getObjectAtCursor(e: FederatedPointerEvent): BaseObjectContainer | null {
    for (const guid of this.ordersLayersKeys) {
      const object = this.layers.get(guid)?.getObjectAtCursor(e);
      if (object) {
        return object;
      }
    }
    return null;
  }

  private sendSceneObjectSelected(object: BaseObjectContainer): void {
    this.sceneObjectSelected$.next({
      guidLayer: object.guidLayer,
      guidObject: object.guidObject,
    });
  }

  private sendSceneObjectChange(object: BaseObjectContainer): void {
    this.sceneObjectChange$.next({
      typeLayer: object.typeLayer,
      guidLayer: object.guidLayer,
      guidObject: object.guidObject,
      rect: {
        x: object.getX(),
        y: object.getY(),
        width: object.getWidth(),
        height: object.getHeight(),
      },
    });
  }
}
