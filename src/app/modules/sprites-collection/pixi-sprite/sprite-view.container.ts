import { ISURect, SUColorHelper } from '@selax/utils';
import { Container, DestroyOptions, Graphics } from 'pixi.js';

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

import { SpriteAdjustmentContainer } from './sprite-adjustment.container';
import { SpriteAnimationContainer } from './sprite-animation.container';

const SPRITE_GROUND_COLOR = 0xaa4f08;
const SPRITE_COLLISION_COLOR = 0x00b899;

export class SpriteViewContainer extends Container {
  onAnimationFrameChange?: (layerGuid: string, currentFrame: number, totalFrames: number) => void;

  onPlayChanged?: (playing: boolean) => void;

  private readonly gSpriteBg = new Graphics();

  private readonly gSpriteRect = new Graphics();

  private readonly gSpriteGroundPoint = new Graphics();

  private readonly gSpriteCollision = new Graphics();

  private spriteParamsHash: string | null = null;

  private spriteGroundPointHash: string | null = null;

  private spriteWidth: number = 0;

  private spriteHeight: number = 0;

  private readonly spriteAdjustmentContainer: SpriteAdjustmentContainer;

  private readonly spriteAnimationContainer: SpriteAnimationContainer;

  constructor(private readonly pixiAppService: PixiAppService) {
    super();
    this.spriteAdjustmentContainer = new SpriteAdjustmentContainer(this.pixiAppService);
    this.spriteAnimationContainer = new SpriteAnimationContainer(this.pixiAppService);
    this.sortableChildren = true;
    this.addChild(this.gSpriteBg);
    this.addChild(this.gSpriteRect);
    this.addChild(this.gSpriteGroundPoint);
    this.addChild(this.gSpriteCollision);
    this.addChild(this.spriteAdjustmentContainer);
    this.addChild(this.spriteAnimationContainer);
    this.gSpriteRect.zIndex = 100;
    this.gSpriteGroundPoint.zIndex = 102;
    this.gSpriteCollision.zIndex = 101;
    this.spriteAnimationContainer.onPlayChanged = (playing: boolean): void => {
      if (typeof this.onPlayChanged === 'function') {
        this.onPlayChanged(playing);
      }
    };
    this.spriteAnimationContainer.onAnimationFrameChange = (
      layerGuid: string,
      currentFrame: number,
      totalFrames: number,
    ): void => {
      if (typeof this.onAnimationFrameChange === 'function') {
        this.onAnimationFrameChange(layerGuid, currentFrame, totalFrames);
      }
    };
  }

  override destroy(options?: DestroyOptions): void {
    this.spriteAdjustmentContainer.destroy();
    super.destroy(options);
  }

  animationPlay(): void {
    if (this.spriteAnimationContainer.visible) {
      this.spriteAnimationContainer.play();
    }
  }

  animationStop(): void {
    this.spriteAnimationContainer.stop();
  }

  gotoAnimationFrame(layerGuid: string, frame: number): void {
    this.spriteAnimationContainer.gotoAnimationFrame(layerGuid, frame);
  }

  setAnimation(animation: ISpriteAnimation | null): void {
    if (animation) {
      this.drawSpriteGroundPoint(
        animation.groundPoint?.x ?? null,
        animation.groundPoint?.y ?? null,
        animation.visibleGroundPoint,
      );
      this.drawCollisionRect(animation.visibleCollisionFrame ? (animation.collisionFrame ?? null) : null);
      this.spriteAnimationContainer.setAnimationLayers(animation.layers);
    } else {
      this.spriteAnimationContainer.hideLayers();
    }
  }

  setAdjustmentMode(mode: AdjustmentModeEnum): void {
    switch (mode) {
      case AdjustmentModeEnum.Sprite:
        //this.animationSpritePreviewContainer.stop();
        this.spriteAdjustmentContainer.visible = true;
        this.spriteAnimationContainer.visible = false;
        break;
      case AdjustmentModeEnum.Animation:
        this.spriteAdjustmentContainer.visible = false;
        this.spriteAnimationContainer.visible = true;
        break;
    }
  }

  async updateSpriteFrame(frame: ISpriteFrame | null, layer: ISpriteLayer | null): Promise<void> {
    await this.spriteAdjustmentContainer.updateSpriteFrame(frame, layer);
    await this.spriteAnimationContainer.updateSpriteFrame(frame, layer, this.spriteWidth, this.spriteHeight);
  }

  async updateSpriteLayersList(layers: ISpriteLayer[]): Promise<void> {
    await this.spriteAdjustmentContainer.updateSpriteLayersList(layers);
    await this.spriteAnimationContainer.updateSpriteLayersList(layers, this.spriteWidth, this.spriteHeight);
  }

  async updateSpriteLayer(layer: ISpriteLayer | null): Promise<void> {
    await this.spriteAdjustmentContainer.updateSpriteLayer(layer);
    await this.spriteAnimationContainer.updateSpriteLayer(layer, this.spriteWidth, this.spriteHeight);
  }

  updateSpriteParams(params: IEditSpriteParams | null): void {
    this.spriteWidth = params?.width ?? 0;
    this.spriteHeight = params?.height ?? 0;
    if (!params) {
      this.gSpriteRect.clear();
      this.gSpriteBg.clear();
      return;
    }
    if (this.spriteParamsHash === JSON.stringify(params)) {
      return;
    }
    this.spriteParamsHash = JSON.stringify(params);
    const fillColor = params.bgColor ? SUColorHelper.hex2hexadecimal(params.bgColor) : null;
    this.drawSpriteRect(params.width, params.height, fillColor);
    if (this.spriteGroundPointHash) {
      try {
        this.updateSpriteGroundPoint(JSON.parse(this.spriteGroundPointHash), true);
        // eslint-disable-next-line no-empty, unused-imports/no-unused-vars
      } catch (e: unknown) {}
    }
  }

  updateSpriteGroundPoint(groundPoint: IEditSpriteGroundPoint | null, force: boolean = false): void {
    if (!groundPoint) {
      this.gSpriteGroundPoint.clear();
      return;
    }
    if (!force && this.spriteGroundPointHash === JSON.stringify(groundPoint)) {
      return;
    }
    if (!force) {
      this.spriteGroundPointHash = JSON.stringify(groundPoint);
    }
    this.drawSpriteGroundPoint(groundPoint.groundPointX, groundPoint.groundPointY, groundPoint.visibleGroundPoint);
  }

  async initializeSprite(sprite: ISprite): Promise<void> {
    this.spriteWidth = sprite?.width ?? 0;
    this.spriteHeight = sprite?.height ?? 0;
    const fillColor = sprite.bgColor ? SUColorHelper.hex2hexadecimal(sprite.bgColor) : null;
    this.drawSpriteRect(sprite.width, sprite.height, fillColor);
    this.drawSpriteGroundPoint(sprite.groundPointX, sprite.groundPointY, sprite.visibleGroundPoint);
    this.spriteParamsHash = JSON.stringify({
      width: sprite.width,
      height: sprite.height,
      bgColor: sprite.bgColor ?? null,
    });
    this.spriteGroundPointHash = JSON.stringify({
      visibleGroundPoint: sprite.visibleGroundPoint,
      groundPointX: sprite.groundPointX,
      groundPointY: sprite.groundPointY,
    });
    await this.spriteAdjustmentContainer.initializeLayers(sprite.layers);
    await this.spriteAnimationContainer.initializeSprite(sprite);
  }

  private drawSpriteRect(width: number, height: number, fillColor: number | null = null): void {
    this.gSpriteRect.clear().rect(0, 0, width, height);
    this.gSpriteBg.clear().rect(0, 0, width, height);
    if (fillColor !== null) {
      this.gSpriteBg.fill(fillColor);
    }
    this.gSpriteRect.stroke({ width: 1, color: 0x000000 });
  }

  private drawSpriteGroundPoint(x: number | null, y: number | null, visible: boolean): void {
    this.gSpriteGroundPoint.clear();
    if (visible && x !== null && y !== null) {
      this.gSpriteGroundPoint
        .moveTo(0, y)
        .lineTo(this.width, y)
        .stroke({ width: 1, color: SPRITE_GROUND_COLOR })
        .circle(x, y, 5)
        .fill(SPRITE_GROUND_COLOR);
    }
  }

  private drawCollisionRect(rect: ISURect | null = null): void {
    this.gSpriteCollision.clear();
    if (rect) {
      this.gSpriteCollision.rect(rect.x, rect.y, rect.width, rect.height).fill({
        color: SPRITE_COLLISION_COLOR,
        alpha: 0.5,
      });
    }
  }
}
