import { DestroyOptions, FederatedPointerEvent, RendererDestroyOptions } from 'pixi.js';
import { Subject } from 'rxjs';

import { SceneLayerTypeEnum } from '~core/constants';
import { ISceneLayer } from '~core/interfaces';
import { AppPixiStateEnum } from '~pixijs/interfaces';
import { PixiApp } from '~pixijs/pixi.app';

import { SBDrawSceneService } from '../../services';
import { LAYER_EVENTS_COLOR, LAYER_GROUND_COLOR } from './constants';
import {
  IObjectRectGraphicsData,
  IPixiSceneLayer,
  ISceneDragObject,
  ISceneLayerMouseEvent,
  ISceneObjectChange,
  ISceneObjectSelected,
} from './interfaces';
import { LayerEventsGroundContainer } from './layer-events-ground.container';
import { LayerGridContainer } from './layer-grid.container';
import { LayerSpritesContainer } from './layers-sprites.container';

interface IObjectAtCursor {
  typeLayer: SceneLayerTypeEnum;
  guidLayer: string;
  object: ISceneDragObject;
  data: unknown;
}

export interface ISceneSpritePlayChanged {
  guidLayer: string;
  guidObject: string;
  playing: boolean;
}

export class ScenePixiApp extends PixiApp {
  readonly sceneObjectChange$ = new Subject<ISceneObjectChange>();

  readonly sceneObjectSelected$ = new Subject<ISceneObjectSelected>();

  readonly sceneSpritePlayChanged$ = new Subject<ISceneSpritePlayChanged>();

  private readonly layers = new Map<string, IPixiSceneLayer>();

  private objectAtCursor: IObjectAtCursor | null = null;

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
    for (const [guid, layer] of this.layers.entries()) {
      if (typeof layer.selectedObject === 'function') {
        layer.selectedObject(guid === guidLayer ? guidObject : null);
      }
    }
  }

  async drawLayers(layers: ISceneLayer[]): Promise<void> {
    // Удаление слоев, которых нет в новом списке
    const layersGuids = layers.map((l: ISceneLayer) => l.guid);
    for (const [guid, layer] of this.layers.entries()) {
      if (!layersGuids.includes(guid)) {
        this.layers.delete(guid);
        layer.destroy();
      }
    }
    // Добавляем новые слои и перерисовываем старые
    for (const layerInfo of layers) {
      let layerContainer = this.layers.get(layerInfo.guid);
      if (!layerContainer) {
        switch (layerInfo.type) {
          case SceneLayerTypeEnum.Grids:
            layerContainer = new LayerGridContainer(this.drawSceneService);
            break;
          case SceneLayerTypeEnum.Events:
            layerContainer = new LayerEventsGroundContainer(LAYER_EVENTS_COLOR);
            break;
          case SceneLayerTypeEnum.Grounds:
            layerContainer = new LayerEventsGroundContainer(LAYER_GROUND_COLOR);
            break;
          case SceneLayerTypeEnum.Sprites:
            layerContainer = new LayerSpritesContainer(this.drawSceneService);
            layerContainer.onSpritePlayChanged = (guidLayer: string, guidObject: string, playing: boolean) => {
              this.sceneSpritePlayChanged$.next({ guidLayer, guidObject, playing });
            };
            break;
          default:
            console.error(`Не известный тип слоя: ${layerInfo.type}`);
            continue;
        }
        layerContainer.typeLayer = layerInfo.type;
        layerContainer.guidLayer = layerInfo.guid;
        this.layers.set(layerInfo.guid, layerContainer);
        this.viewport.addChild(layerContainer);
        layerContainer.onObjectMouseMove = this.onObjectMouseMove;
        layerContainer.onObjectMouseLeave = this.onObjectMouseLeave;
      }
      layerContainer.x = layerInfo.x;
      layerContainer.y = layerInfo.y;
      layerContainer.zIndex = layerInfo.zIndex;
      layerContainer.visible = layerInfo.visible;
      switch (layerInfo.type) {
        case SceneLayerTypeEnum.Grids:
          if (layerInfo.referenceGridId) {
            await layerContainer.drawObjects({ referenceGridId: layerInfo.referenceGridId });
          }
          break;
        default:
          await layerContainer.drawObjects(layerInfo.objects);
      }
    }
  }

  protected override onPointerDown(e: FederatedPointerEvent): void {
    super.onPointerDown(e);
    if (this.objectAtCursor && this._dragStart) {
      this._dragStart = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        objectX: this.objectAtCursor.object.getX(),
        objectY: this.objectAtCursor.object.getY(),
        objectWidth: this.objectAtCursor.object.getWidth(),
        objectHeight: this.objectAtCursor.object.getHeight(),
      };
    }
  }

  protected override onPointerMove(e: FederatedPointerEvent): void {
    super.onPointerMove(e);
    if (this.state === AppPixiStateEnum.DragObject && this.objectAtCursor && this._isDragging) {
      switch (this.objectAtCursor.typeLayer) {
        case SceneLayerTypeEnum.Events:
        case SceneLayerTypeEnum.Grounds:
          this.dragEventsGroundsObject(
            this.objectAtCursor.object,
            this.objectAtCursor.data as IObjectRectGraphicsData,
            e,
          );
          break;
        case SceneLayerTypeEnum.Sprites:
          this.dragSpriteObject(this.objectAtCursor.object, e);
          break;
      }
    }
  }

  protected override onPointerUp(): void {
    if (this._isDragging) {
      this.setViewCursor();
    }
    super.onPointerUp();
    if (this.objectAtCursor) {
      switch (this._state) {
        case AppPixiStateEnum.DragObject:
          this.sendSceneObjectChange(this.objectAtCursor);
          this.sendSceneObjectSelected(this.objectAtCursor);
          break;
        case AppPixiStateEnum.Info:
          this.sendSceneObjectSelected(this.objectAtCursor);
          break;
      }
    }
  }

  private onObjectMouseMove = (info: ISceneLayerMouseEvent): void => {
    if (this._dragStart) {
      return;
    }
    this.objectAtCursor = {
      typeLayer: info.typeLayer,
      guidLayer: info.guidLayer,
      object: info.object,
      data: info.data,
    };
    if (
      this._state === AppPixiStateEnum.DragObject &&
      [SceneLayerTypeEnum.Events, SceneLayerTypeEnum.Grounds].includes(info.typeLayer)
    ) {
      const cursor = (info.data as IObjectRectGraphicsData).cursor;
      if (cursor) {
        this.canvas.style.cursor = cursor;
      }
    }
  };

  private onObjectMouseLeave = (): void => {
    if (!this._isDragging) {
      this.objectAtCursor = null;
      this.setViewCursor();
    }
  };

  private dragSpriteObject(object: ISceneDragObject, e: FederatedPointerEvent): void {
    if (this._dragStart) {
      const dx = e.clientX - this._dragStart.mouseX;
      const dy = e.clientY - this._dragStart.mouseY;
      if (typeof object.objectSetXY === 'function') {
        object.objectSetXY({ x: dx + this._dragStart.objectX!, y: dy + this._dragStart.objectY! });
      }
    }
  }

  private dragEventsGroundsObject(
    object: ISceneDragObject,
    data: IObjectRectGraphicsData,
    e: FederatedPointerEvent,
  ): void {
    if (!this._dragStart) {
      return;
    }
    const dx = e.clientX - this._dragStart.mouseX;
    const dy = e.clientY - this._dragStart.mouseY;
    if (data.mode === 'drag') {
      if (typeof object.objectSetXY === 'function') {
        object.objectSetXY({ x: dx + this._dragStart.objectX!, y: dy + this._dragStart.objectY! });
      }
    } else if (data.mode === 'resize') {
      if (typeof object.objectResize === 'function') {
        object.objectResize(
          { x: this._dragStart.objectX!, y: this._dragStart.objectY! },
          { x: dx, y: dy },
          { width: this._dragStart.objectWidth!, height: this._dragStart.objectHeight! },
          data.cursor,
        );
      }
    }
  }

  private sendSceneObjectChange(params: IObjectAtCursor): void {
    this.sceneObjectChange$.next({
      typeLayer: params.typeLayer,
      guidLayer: params.guidLayer,
      guidObject: params.object.guidObject,
      rect: {
        x: params.object.getX(),
        y: params.object.getY(),
        width: params.object.getWidth(),
        height: params.object.getHeight(),
      },
    });
  }

  private sendSceneObjectSelected(params: IObjectAtCursor): void {
    this.sceneObjectSelected$.next({
      guidLayer: params.guidLayer,
      guidObject: params.object.guidObject,
    });
  }
}
