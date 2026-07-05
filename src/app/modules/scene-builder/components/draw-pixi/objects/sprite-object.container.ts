import { DestroyOptions, FederatedPointerEvent } from 'pixi.js';

import { ISceneObjectSprite, ISpriteAnimation, ISpriteAnimationLayer } from '~core/interfaces';

import { BaseObjectContainer } from '../base-object.container';
import { SpriteLayerContainer } from './sprite-layer.container';

export class SpriteObjectContainer extends BaseObjectContainer {
  onPlayChanged: ((guidObject: string, playing: boolean) => void) | null = null;

  private readonly layers = new Map<string, SpriteLayerContainer>();

  private animationsList: ISpriteAnimation[] = [];

  private lastAnimationGuid: string | null = null;

  private playingLayers: Record<string, boolean> = {};

  private isInitialized = false;

  override destroy(options?: DestroyOptions): void {
    for (const layer of this.layers.values()) {
      layer.destroy();
    }
    this.layers.clear();
    super.destroy(options);
  }

  override selectObject(selected: boolean): void {
    for (const layerContainer of this.layers.values()) {
      layerContainer.selectedSprite(selected);
    }
  }

  override async drawObject(objectInfo: ISceneObjectSprite): Promise<void> {
    if (this.isInitialized) {
      this.updateSprite(objectInfo);
    } else if (objectInfo.referenceId) {
      await this.initialize(objectInfo.referenceId, objectInfo);
    }
  }

  override getObjectAtCursor(e: FederatedPointerEvent): BaseObjectContainer | null {
    for (const layerContainer of this.layers.values()) {
      if (layerContainer.visible && layerContainer.isHitTest(e)) {
        return this;
      }
    }
    return null;
  }

  isPlaying(): boolean {
    for (const layerContainer of this.layers.values()) {
      if (layerContainer.visible && layerContainer.isPlaying()) {
        return true;
      }
    }
    return false;
  }

  play(): void {
    if (this.isPlaying()) {
      return;
    }
    this.playingLayers = {};
    let hasChanged = false;
    for (const [layerGuid, layerContainer] of this.layers.entries()) {
      if (layerContainer.visible) {
        this.playingLayers[layerGuid] = true;
        layerContainer.play();
        hasChanged = true;
      }
    }
    if (hasChanged && typeof this.onPlayChanged === 'function') {
      this.onPlayChanged(this.guidObject, true);
    }
  }

  stop(emitEvents: boolean = false): void {
    this.playingLayers = {};
    for (const layerContainer of this.layers.values()) {
      if (layerContainer.visible) {
        layerContainer.stop();
      }
    }
    if (!emitEvents && typeof this.onPlayChanged === 'function') {
      this.onPlayChanged(this.guidObject, false);
    }
  }

  private async initialize(referenceId: number, objectInfo: ISceneObjectSprite): Promise<void> {
    const spriteInfo = await this.drawSceneService!.fetchSpriteById(referenceId);
    this.animationsList = spriteInfo.animations;
    for (const layer of spriteInfo.layers) {
      const layerContainer = new SpriteLayerContainer(this.drawSceneService!);
      layerContainer.onAnimationComplete = (layerGuid: string) => this.layerAnimationComplete(layerGuid);
      this.layers.set(layer.guid, layerContainer);
      this.addChild(layerContainer);
      layerContainer.zIndex = layer.zIndex ?? 0;
      layerContainer.visible = false;
      await layerContainer.drawLayer(layer, spriteInfo.width, spriteInfo.height);
    }
    this.isInitialized = true;
    this.updateSprite(objectInfo);
  }

  private updateSprite(spriteInfo: ISceneObjectSprite): void {
    if (this.lastAnimationGuid !== spriteInfo.animationGuid) {
      this.lastAnimationGuid = spriteInfo.animationGuid;
      const animation = this.animationsList.find((item: ISpriteAnimation) => item.guid === this.lastAnimationGuid);
      this.setAnimationLayers(animation?.layers ?? []);
    }
    if (spriteInfo.playing) {
      if (!this.isPlaying()) {
        this.play();
      }
    } else if (this.isPlaying()) {
      this.stop();
    }
  }

  private layerAnimationComplete(layerGuid: string): void {
    if (this.playingLayers[layerGuid]) {
      this.playingLayers[layerGuid] = false;
    }
    if (!Object.values(this.playingLayers).some((i: boolean) => i)) {
      this.stop();
    }
  }

  private setAnimationLayers(layers: ISpriteAnimationLayer[]): void {
    this.stop(false);
    this.hideAllSpriteLayers();
    for (const layer of layers) {
      const layerContainer = this.layers.get(layer.layerGuid);
      if (layerContainer) {
        layerContainer.setSpriteAnimationLayer(layer);
        layerContainer.visible = true;
      }
    }
  }

  private hideAllSpriteLayers(): void {
    for (const spriteLayer of this.layers.values()) {
      spriteLayer.visible = false;
    }
  }
}
