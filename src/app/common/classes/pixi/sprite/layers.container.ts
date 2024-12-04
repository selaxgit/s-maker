import { AnimatedSprite, Container, DestroyOptions } from 'pixi.js';
import { Subject, takeUntil } from 'rxjs';

import { ISpriteAnimationLayer, ISpriteLayersListItem } from '../../../interfaces';
import { FramesCacheService } from '../../../services/cache';
import { ISpriteAnimationFrameEvent } from './interfaces';
import { LayerContainer } from './layer.container';

export class LayersContainer extends Container {
  public animationCompleteEvent = new Subject<void>();

  public animationFrameChangeEvent = new Subject<ISpriteAnimationFrameEvent>();

  public spriteMouseEnterEvent = new Subject<AnimatedSprite>();

  public spriteMouseLeaveEvent = new Subject<AnimatedSprite>();

  public spriteWidth = 0;

  public spriteHeight = 0;

  private layers: Map<number, LayerContainer> = new Map();

  private playingLayers: number | null = null;

  private ngUnsubscribe = new Subject<void>();

  constructor(private readonly framesCacheService: FramesCacheService) {
    super();
    this.sortableChildren = true;
  }

  public set play(val: boolean) {
    this.playingLayers = val ? 0 : null;
    this.layers.forEach((layer: LayerContainer) => {
      if (layer.visible) {
        layer.play = val;
        if (val && this.playingLayers !== null) {
          this.playingLayers++;
        }
      } else {
        layer.play = false;
      }
    });
  }

  public get playing(): boolean {
    for (const key of this.layers.keys()) {
      if (this.layers.get(key)?.playing) {
        return true;
      }
    }
    return false;
  }

  public override destroy(option?: DestroyOptions): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.layers.forEach((layer: LayerContainer) => layer.destroy());
    this.layers.clear();
    super.destroy(option);
  }

  public setCurrentFrame(frame: number): void {
    this.layers.forEach((layer: LayerContainer) => {
      if (layer.visible) {
        layer.setCurrentFrame(frame);
      }
    });
  }

  public updateSpriteLayers(layers: ISpriteAnimationLayer[]): void {
    const layersIds = layers.map((l: ISpriteAnimationLayer) => l.layerId);
    for (const key of this.layers.keys()) {
      if (!layersIds.includes(key)) {
        this.layers.get(key)?.setVisible(false);
      }
    }
    for (const layer of layers) {
      if (layer.layerId && this.layers.has(layer.layerId)) {
        this.layers.get(layer.layerId)?.setLayerState(layer);
        this.layers.get(layer.layerId)?.setVisible(true);
      }
    }
  }

  public async setLayers(layers: ISpriteLayersListItem[]): Promise<void> {
    const layersIds: number[] = [];
    for (const layer of layers) {
      layersIds.push(layer.id);
      if (!this.layers.has(layer.id)) {
        await this.addLayer(layer);
      } else {
        await this.updateLayer(layer);
      }
    }
    for (const id of this.layers.keys()) {
      if (!layersIds.includes(id)) {
        this.layers.get(id)?.destroy(true);
        this.layers.delete(id);
      }
    }
  }

  private async updateLayer(layerInfo: ISpriteLayersListItem): Promise<void> {
    const layer = this.layers.get(layerInfo.id);
    if (layer) {
      layer.updateLayerInfo(layerInfo);
    }
  }

  private async addLayer(layerInfo: ISpriteLayersListItem): Promise<void> {
    const layer = new LayerContainer(this.framesCacheService, this.spriteWidth, this.spriteHeight);
    await layer.initialize(layerInfo);
    this.addChild(layer);
    this.layers.set(layerInfo.id, layer);
    layer.animationFrameChangeEvent
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((currentFrame: ISpriteAnimationFrameEvent) => {
        this.animationFrameChangeEvent.next(currentFrame);
      });
    layer.animationCompleteEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      if (this.playingLayers !== null) {
        this.playingLayers--;
        if (this.playingLayers <= 0) {
          this.playingLayers = null;
          this.animationCompleteEvent.next();
        }
      }
    });
    layer.spriteMouseEnterEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe((sprite: AnimatedSprite) => {
      this.spriteMouseEnterEvent.next(sprite);
    });
    layer.spriteMouseLeaveEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe((sprite: AnimatedSprite) => {
      this.spriteMouseLeaveEvent.next(sprite);
    });
  }
}
