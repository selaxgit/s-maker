import { Container, DestroyOptions } from 'pixi.js';

import { ISprite, ISpriteAnimationLayer, ISpriteFrame, ISpriteLayer } from '~core/interfaces';
import { PixiAppService } from '~core/services';

import { SpriteAnimationLayerContainer } from './sprite-animation-layer.container';

export class SpriteAnimationContainer extends Container {
  onAnimationFrameChange?: (layerGuid: string, currentFrame: number, totalFrames: number) => void;

  onPlayChanged?: (playing: boolean) => void;

  private readonly spriteLayers = new Map<string, SpriteAnimationLayerContainer>();

  private playingLayers: Record<string, boolean> = {};

  constructor(private readonly pixiAppService: PixiAppService) {
    super();
  }

  override destroy(options?: DestroyOptions): void {
    this.spriteLayers.forEach((container: SpriteAnimationLayerContainer) => {
      container.destroy();
    });
    super.destroy(options);
  }

  gotoAnimationFrame(layerGuid: string, frame: number): void {
    const layerContainer = this.spriteLayers.get(layerGuid);
    if (layerContainer) {
      layerContainer.gotoAndStop(frame);
    }
  }

  playing(): boolean {
    for (const layerContainer of this.spriteLayers.values()) {
      if (layerContainer.visible && layerContainer.playing()) {
        return true;
      }
    }
    return false;
  }

  play(): void {
    this.playingLayers = {};
    let playingState = false;
    for (const [layerGuid, layerContainer] of this.spriteLayers.entries()) {
      if (layerContainer.visible) {
        this.playingLayers[layerGuid] = true;
        layerContainer.play();
        playingState = true;
      }
    }
    if (playingState && typeof this.onPlayChanged === 'function') {
      this.onPlayChanged(true);
    }
  }

  stop(): void {
    this.playingLayers = {};
    for (const layerContainer of this.spriteLayers.values()) {
      if (layerContainer.visible) {
        layerContainer.stop();
      }
    }
    if (typeof this.onPlayChanged === 'function') {
      this.onPlayChanged(false);
    }
  }

  hideLayers(): void {
    for (const layerContainer of this.spriteLayers.values()) {
      layerContainer.hide();
    }
  }

  setAnimationLayers(layers: ISpriteAnimationLayer[]): void {
    this.stop();
    for (const spriteLayer of this.spriteLayers.values()) {
      spriteLayer.visible = false;
    }
    for (const layer of layers) {
      const layerContainer = this.spriteLayers.get(layer.layerGuid);
      if (layerContainer) {
        layerContainer.setAnimationLayer(layer);
        layerContainer.visible = true;
      }
    }
  }

  async updateSpriteFrame(
    frame: ISpriteFrame | null,
    layer: ISpriteLayer | null,
    spriteWidth: number,
    spriteHeight: number,
  ): Promise<void> {
    if (frame && layer) {
      this.stop();
      await this.spriteLayers.get(layer.guid)?.updateSpriteFrame(frame, layer, spriteWidth, spriteHeight);
    }
  }

  async updateSpriteLayersList(layers: ISpriteLayer[], spriteWidth: number, spriteHeight: number): Promise<void> {
    // Удаление слоев, которых нет в новом списке
    const layersGuids = layers.map((l: ISpriteLayer) => l.guid);
    for (const [layerGuid, adjLayer] of this.spriteLayers.entries()) {
      if (!layersGuids.includes(layerGuid)) {
        this.spriteLayers.delete(layerGuid);
        adjLayer.destroy();
      }
    }
    // обновление или добавление новых слоев
    for (const layer of layers) {
      const adjLayer = this.spriteLayers.get(layer.guid);
      if (adjLayer) {
        await adjLayer.drawLayer(layer, spriteWidth, spriteHeight);
      } else {
        const newAdjLayer = new SpriteAnimationLayerContainer(this.pixiAppService);
        newAdjLayer.onAnimationComplete = (layerGuid: string) => this.layerAnimationComplete(layerGuid);
        newAdjLayer.onAnimationFrameChange = (layerGuid: string, currentFrame: number, totalFrames: number) => {
          if (typeof this.onAnimationFrameChange === 'function') {
            this.onAnimationFrameChange(layerGuid, currentFrame, totalFrames);
          }
        };
        this.spriteLayers.set(layer.guid, newAdjLayer);
        this.addChild(newAdjLayer);
        await newAdjLayer.drawLayer(layer, spriteWidth, spriteHeight);
      }
    }
  }

  async updateSpriteLayer(layer: ISpriteLayer | null, spriteWidth: number, spriteHeight: number): Promise<void> {
    if (layer) {
      const adjLayer = this.spriteLayers.get(layer.guid);
      if (adjLayer) {
        await adjLayer.drawLayer(layer, spriteWidth, spriteHeight);
      }
    }
  }

  async initializeSprite(sprite: ISprite): Promise<void> {
    await this.updateSpriteLayersList(sprite.layers, sprite.width, sprite.height);
  }

  private layerAnimationComplete(layerGuid: string): void {
    if (this.playingLayers[layerGuid]) {
      this.playingLayers[layerGuid] = false;
    }
    if (!Object.values(this.playingLayers).some((i: boolean) => i)) {
      this.stop();
    }
  }
}
