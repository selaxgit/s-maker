import { DestroyOptions, RendererDestroyOptions } from 'pixi.js';

import { AdjustmentModeEnum } from '~core/constants';
import {
  IEditSpriteGroundPoint,
  IEditSpriteParams,
  ISprite,
  ISpriteAnimation,
  ISpriteFrame,
  ISpriteLayer,
} from '~core/interfaces';
import { PixiAppService } from '~core/services';
import { PixiApp } from '~pixijs/pixi.app';

import { SpriteViewContainer } from './sprite-view.container';

export class SpriteApp extends PixiApp {
  onAnimationFrameChange?: (layerGuid: string, currentFrame: number, totalFrames: number) => void;

  onPlayChanged?: (playing: boolean) => void;

  private spriteViewContainer: SpriteViewContainer;

  constructor(private readonly pixiAppService: PixiAppService) {
    super();
    this.spriteViewContainer = new SpriteViewContainer(this.pixiAppService);
    this.spriteViewContainer.onPlayChanged = (playing: boolean): void => {
      if (typeof this.onPlayChanged === 'function') {
        this.onPlayChanged(playing);
      }
    };

    this.spriteViewContainer.onAnimationFrameChange = (
      layerGuid: string,
      currentFrame: number,
      totalFrames: number,
    ): void => {
      if (typeof this.onAnimationFrameChange === 'function') {
        this.onAnimationFrameChange(layerGuid, currentFrame, totalFrames);
      }
    };
  }

  override destroy(rendererDestroyOptions: RendererDestroyOptions = false, options: DestroyOptions = false): void {
    this.spriteViewContainer.destroy();
    super.destroy(rendererDestroyOptions, options);
  }

  override async initialize(element: HTMLElement): Promise<void> {
    await super.initialize(element);
    this.viewport.addChild(this.spriteViewContainer);
  }

  animationPlay(): void {
    this.spriteViewContainer.animationPlay();
  }

  animationStop(): void {
    this.spriteViewContainer.animationStop();
  }

  gotoAnimationFrame(layerGuid: string, frame: number): void {
    this.spriteViewContainer.gotoAnimationFrame(layerGuid, frame);
  }

  setAnimation(animation: ISpriteAnimation | null): void {
    this.spriteViewContainer.setAnimation(animation);
  }

  setAdjustmentMode(mode: AdjustmentModeEnum): void {
    this.spriteViewContainer.setAdjustmentMode(mode);
  }

  updateSpriteFrame(frame: ISpriteFrame | null, layer: ISpriteLayer | null): Promise<void> {
    return this.spriteViewContainer.updateSpriteFrame(frame, layer);
  }

  updateSpriteLayersList(layers: ISpriteLayer[]): Promise<void> {
    return this.spriteViewContainer.updateSpriteLayersList(layers);
  }

  updateSpriteLayer(layer: ISpriteLayer | null): Promise<void> {
    return this.spriteViewContainer.updateSpriteLayer(layer);
  }

  updateSpriteGroundPoint(groundPoint: IEditSpriteGroundPoint | null, force: boolean = false): void {
    this.spriteViewContainer.updateSpriteGroundPoint(groundPoint, force);
  }

  updateSpriteParams(params: IEditSpriteParams | null): void {
    this.spriteViewContainer.updateSpriteParams(params);
    if (this._centeredAfterScale) {
      this.setCenteredViewport();
    }
  }

  async initializeSprite(sprite: ISprite): Promise<void> {
    await this.spriteViewContainer.initializeSprite(sprite);
    if (this._centeredAfterScale) {
      this.setCenteredViewport();
    }
  }
}
