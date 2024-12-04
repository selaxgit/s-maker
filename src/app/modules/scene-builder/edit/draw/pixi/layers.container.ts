import { Container, DestroyOptions } from 'pixi.js';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';

import { EditorToolStateType, ISceneObject, IStoreKeyCanvas } from '../../../../../common/interfaces';
import { FramesCacheService } from '../../../../../common/services/cache';
import { SpritesService } from '../../../../../common/services/sprites';
import { TilesGridService } from '../../../../../common/services/tiles';
import { BaseLayer } from './base.layer';
import { ICurrentObject, LAYER_EVENTS_COLOR, LAYER_GROUND_COLOR } from './constants';
import { LayerGrid } from './layer.grid';
import { LayerRect } from './layer.rect';
import { LayerSprites } from './layer.sprites';

export class LayersContainer extends Container {
  public objectEnterEvent = new Subject<ICurrentObject>();

  public objectLeaveEvent = new Subject<ICurrentObject>();

  private layers: Map<number, BaseLayer> = new Map();

  private framesStore: IStoreKeyCanvas = {};

  private hUnsubscribe = new Subject<void>();

  private toolStateValue: EditorToolStateType = 'move';

  constructor(
    private readonly tilesGridService: TilesGridService,
    private readonly framesCacheService: FramesCacheService,
    private readonly spritesService: SpritesService,
    private readonly onChangeSize: (width: number, height: number) => void,
  ) {
    super();
  }

  public override destroy(options?: DestroyOptions): void {
    this.hUnsubscribe.next();
    this.hUnsubscribe.complete();
    super.destroy(options);
  }

  public set toolState(value: EditorToolStateType) {
    this.toolStateValue = value;
    this.layers.forEach((layer: BaseLayer) => (layer.toolState = value));
  }

  public updateFramesStore(store: IStoreKeyCanvas): void {
    this.framesStore = store;
  }

  public async updateSceneObjects(sceneObjects: ISceneObject[]): Promise<void> {
    let maxWidth = 0;
    let maxHeight = 0;
    const realIds: number[] = [];
    for (const obj of sceneObjects) {
      realIds.push(obj.id);
      let layer: BaseLayer | null = null;
      if (this.layers.has(obj.id)) {
        layer = this.layers.get(obj.id) as BaseLayer;
      } else {
        switch (obj.type) {
          case 'layer-grid':
            if (obj.referenceId) {
              const grid = await lastValueFrom(this.tilesGridService.getTileGrid(obj.referenceId));
              layer = new LayerGrid(grid, this.framesStore);
              this.addChild(layer);
            }
            break;
          case 'layer-events':
            layer = new LayerRect(LAYER_EVENTS_COLOR, 'event');
            this.addChild(layer);
            break;
          case 'layer-ground':
            layer = new LayerRect(LAYER_GROUND_COLOR, 'ground');
            this.addChild(layer);
            break;
          case 'layer-sprites':
            layer = new LayerSprites(this.framesCacheService, this.spritesService);
            this.addChild(layer);
            break;
          default:
            continue;
        }
        if (layer) {
          this.layers.set(obj.id, layer);
        }
      }
      if (layer) {
        await layer.updateLayer(obj);
        layer.toolState = this.toolStateValue;
        if (maxWidth < layer.maxWidth) {
          maxWidth = layer.maxWidth;
        }
        if (maxHeight < layer.maxHeight) {
          maxHeight = layer.maxHeight;
        }
        layer.objectEnterEvent.pipe(takeUntil(this.hUnsubscribe)).subscribe((object: ICurrentObject) => {
          this.objectEnterEvent.next(object);
        });
        layer.objectLeaveEvent.pipe(takeUntil(this.hUnsubscribe)).subscribe((object: ICurrentObject) => {
          this.objectLeaveEvent.next(object);
        });
      }
    }
    this.layers.forEach((layer: BaseLayer, key: number) => {
      if (!realIds.includes(key)) {
        layer.destroy();
        this.layers.delete(key);
      }
    });
    if (typeof this.onChangeSize === 'function') {
      this.onChangeSize(maxWidth, maxHeight);
    }
  }
}
