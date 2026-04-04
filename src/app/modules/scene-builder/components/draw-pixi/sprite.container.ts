import { ISUCoords } from '@selax/utils';
import { Container, DestroyOptions } from 'pixi.js';

import { ISceneObjectSprite, ISpriteAnimation, ISpriteAnimationLayer } from '~core/interfaces';

import { SBDrawSceneService } from '../../services';
import { ISceneDragObject } from './interfaces';
import { SpriteLayerContainer } from './sprite-layer.container';

export class SpriteContainer extends Container implements ISceneDragObject {
  onPlayChanged: ((guidObject: string, playing: boolean) => void) | null = null;

  onObjectMouseMove: ((guidObject: string, object: SpriteContainer) => void) | null = null;

  onObjectMouseLeave: (() => void) | null = null;

  private readonly layers = new Map<string, SpriteLayerContainer>();

  private animationsList: ISpriteAnimation[] = [];

  private lastAnimationGuid: string | null = null;

  private playingLayers: Record<string, boolean> = {};

  constructor(
    readonly guidObject: string,
    private readonly drawSceneService: SBDrawSceneService,
  ) {
    super();
  }

  override destroy(options?: DestroyOptions): void {
    for (const layer of this.layers.values()) {
      layer.destroy();
    }
    this.layers.clear();
    super.destroy(options);
  }

  getX(): number {
    return this.x;
  }

  getY(): number {
    return this.y;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  objectSetXY(coords: ISUCoords): void {
    this.x = coords.x;
    this.y = coords.y;
  }

  selectedObject(selected: boolean): void {
    for (const layerContainer of this.layers.values()) {
      layerContainer.selectedSprite(selected);
    }
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

  async updateSprite(spriteInfo: ISceneObjectSprite): Promise<void> {
    this.visible = spriteInfo.visible;
    this.x = spriteInfo.x;
    this.y = spriteInfo.y;
    this.zIndex = spriteInfo.zIndex;
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

  async initSprite(sceneSpriteInfo: ISceneObjectSprite): Promise<void> {
    if (!sceneSpriteInfo.referenceId) {
      return;
    }
    const spriteInfo = await this.drawSceneService.fetchSpriteById(sceneSpriteInfo.referenceId);
    this.animationsList = spriteInfo.animations;
    for (const layer of spriteInfo.layers) {
      const layerContainer = new SpriteLayerContainer(this.drawSceneService);
      layerContainer.onAnimationComplete = (layerGuid: string) => this.layerAnimationComplete(layerGuid);
      layerContainer.onObjectMouseMove = () => this.sendObjectMouseMove();
      layerContainer.onObjectMouseLeave = () => this.sendObjectMouseLeave();
      this.layers.set(layer.guid, layerContainer);
      this.addChild(layerContainer);
      layerContainer.zIndex = layer.zIndex ?? 0;
      layerContainer.visible = false;
      await layerContainer.drawLayer(layer, spriteInfo.width, spriteInfo.height);
    }
    this.updateSprite(sceneSpriteInfo);
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

  private layerAnimationComplete(layerGuid: string): void {
    if (this.playingLayers[layerGuid]) {
      this.playingLayers[layerGuid] = false;
    }
    if (!Object.values(this.playingLayers).some((i: boolean) => i)) {
      this.stop();
    }
  }

  private sendObjectMouseMove(): void {
    if (typeof this.onObjectMouseMove === 'function') {
      this.onObjectMouseMove(this.guidObject, this);
    }
  }

  private sendObjectMouseLeave(): void {
    if (typeof this.onObjectMouseLeave === 'function') {
      this.onObjectMouseLeave();
    }
  }
}
