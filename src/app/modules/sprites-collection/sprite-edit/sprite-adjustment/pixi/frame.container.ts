import { Container, Sprite, Texture } from 'pixi.js';

import { ISpriteFrame } from '../../../../../common/interfaces';
import { IFrameCache } from '../../../../../common/services/cache';

export class FrameContainer extends Container {
  private readonly sprite!: Sprite;

  private readonly spriteFlipH!: Sprite;

  private readonly spriteFlipV!: Sprite;

  private readonly spriteFlipHV!: Sprite;

  constructor(frameCache: IFrameCache) {
    super();
    if (frameCache.canvas) {
      this.sprite = new Sprite(Texture.from(frameCache.canvas));
      this.addChild(this.sprite);
    }
    if (frameCache.canvasFlipH) {
      this.spriteFlipH = new Sprite(Texture.from(frameCache.canvasFlipH));
      this.addChild(this.spriteFlipH);
    }
    if (frameCache.canvasFlipV) {
      this.spriteFlipV = new Sprite(Texture.from(frameCache.canvasFlipV));
      this.addChild(this.spriteFlipV);
    }
    if (frameCache.canvasFlipHV) {
      this.spriteFlipHV = new Sprite(Texture.from(frameCache.canvasFlipHV));
      this.addChild(this.spriteFlipHV);
    }
  }

  public updateFrame(frameInfo: ISpriteFrame, flipHorizontal: boolean, flipVertical: boolean): void {
    this.x = frameInfo.x;
    this.y = frameInfo.y;
    this.visible = frameInfo.visible;
    this.sprite.visible = false;
    this.spriteFlipH.visible = false;
    this.spriteFlipV.visible = false;
    this.spriteFlipHV.visible = false;
    if (flipHorizontal && flipVertical) {
      this.spriteFlipHV.visible = true;
    } else if (flipHorizontal) {
      this.spriteFlipH.visible = true;
    } else if (flipVertical) {
      this.spriteFlipV.visible = true;
    } else {
      this.sprite.visible = true;
    }
  }
}
