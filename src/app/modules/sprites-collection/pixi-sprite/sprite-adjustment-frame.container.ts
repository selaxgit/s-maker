import { Container, DestroyOptions, Sprite, Texture } from 'pixi.js';

import { ISpriteFrame } from '~core/interfaces';
import { PixiAppService } from '~core/services';

export class SpriteAdjustmentFrameContainer extends Container {
  private currentFrameKey: string | null = null;

  private readonly frameSprites = new Map<string, Sprite>();

  constructor(
    private readonly defFrame: ISpriteFrame,
    private readonly pixiAppService: PixiAppService,
    private readonly onCalculateLayerRect: () => void,
  ) {
    super();
  }

  override destroy(options?: DestroyOptions): void {
    this.frameSprites.forEach((sprite: Sprite) => {
      sprite.destroy();
    });
    super.destroy(options);
  }

  async updateFrame(flipHorizontal: boolean, flipVertical: boolean, frame: ISpriteFrame | null = null): Promise<void> {
    if (frame) {
      this.x = frame.x;
      this.y = frame.y;
      this.zIndex = frame.zIndex;
      this.visible = frame.visible;
      this.onCalculateLayerRect();
    }
    const frameKey = `${String(flipHorizontal)}-${String(flipVertical)}`;
    if (this.currentFrameKey !== frameKey) {
      this.currentFrameKey = frameKey;
      await this.drawFrameSprite(flipHorizontal, flipVertical);
    }
  }

  async initialize(flipHorizontal: boolean, flipVertical: boolean): Promise<void> {
    this.x = this.defFrame.x;
    this.y = this.defFrame.y;
    this.zIndex = this.defFrame.zIndex;
    this.visible = this.defFrame.visible;
    this.currentFrameKey = `${String(flipHorizontal)}-${String(flipVertical)}`;
    await this.drawFrameSprite(flipHorizontal, flipVertical);
  }

  private async drawFrameSprite(flipHorizontal: boolean, flipVertical: boolean): Promise<void> {
    const frameKey = `${String(flipHorizontal)}-${String(flipVertical)}`;
    this.frameSprites.forEach((sprite: Sprite, sKey: string) => (sprite.visible = sKey === frameKey));
    if (!this.frameSprites.has(frameKey)) {
      const cachedInfo = await this.pixiAppService.getFrameCanvasCache(this.defFrame.frameId);
      if (cachedInfo) {
        let canvas: HTMLCanvasElement | null;
        if (flipHorizontal && flipVertical) {
          canvas = cachedInfo.canvasFlipHV;
        } else if (flipHorizontal) {
          canvas = cachedInfo.canvasFlipH;
        } else if (flipVertical) {
          canvas = cachedInfo.canvasFlipV;
        } else {
          canvas = cachedInfo.canvas;
        }
        if (canvas) {
          const sprite = new Sprite(Texture.from(canvas));
          this.addChild(sprite);
          this.frameSprites.set(frameKey, sprite);
        }
      }
    }
  }
}
