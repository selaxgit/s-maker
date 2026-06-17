import { AnimatedSprite, AnimatedSpriteFrames, Container, DestroyOptions, FrameObject, Texture } from 'pixi.js';

import { ISpriteAnimationLayer, ISpriteFrame, ISpriteLayer } from '~core/interfaces';
import { PixiAppService } from '~core/services';

export class SpriteAnimationLayerContainer extends Container {
  onAnimationComplete?: (layerGuid: string) => void;

  onAnimationFrameChange?: (layerGuid: string, currentFrame: number, totalFrames: number) => void;

  private readonly layerFrames = new Map<string, { hash: string; canvas: HTMLCanvasElement }>();

  private layerHash: string | null = null;

  private layerSprite: AnimatedSprite | null = null;

  private animationLayer: ISpriteAnimationLayer | null = null;

  private layerGuid: string | null = null;

  constructor(private readonly pixiAppService: PixiAppService) {
    super();
  }

  gotoAndStop(frame: number): void {
    if (this.layerSprite) {
      this.layerSprite.gotoAndStop(frame);
    }
  }

  playing(): boolean {
    return this.layerSprite?.playing ?? false;
  }

  play(): void {
    if (this.layerSprite) {
      this.layerSprite.gotoAndPlay(0);
    }
  }

  stop(): void {
    if (this.layerSprite) {
      this.layerSprite.stop();
    }
  }

  hide(): void {
    this.animationLayer = null;
    this.visible = false;
  }

  override destroy(options?: DestroyOptions): void {
    if (this.layerSprite) {
      this.layerSprite.destroy();
      this.layerSprite = null;
    }
    this.layerFrames.clear();
    super.destroy(options);
  }

  setAnimationLayer(layer: ISpriteAnimationLayer): void {
    this.animationLayer = layer;
    if (this.layerSprite) {
      this.layerSprite.destroy();
      this.layerSprite = null;
    }
    const failAllFrameSpeed = Object.values(layer.frames).some((frame: number | null) => frame === null);
    const spriteFrames: AnimatedSpriteFrames = [];
    for (const [frameGuid, cache] of this.layerFrames.entries()) {
      if (failAllFrameSpeed) {
        (spriteFrames as Texture[]).push(Texture.from(cache.canvas));
      } else if (layer.frames[frameGuid]) {
        (spriteFrames as FrameObject[]).push({ texture: Texture.from(cache.canvas), time: layer.frames[frameGuid] });
      }
    }
    if (spriteFrames.length > 0) {
      this.layerSprite = new AnimatedSprite(spriteFrames);
      this.layerSprite.loop = layer.loop;
      if (failAllFrameSpeed && layer.speed) {
        this.layerSprite.animationSpeed = layer.speed;
      }
      this.addChild(this.layerSprite);
      this.layerSprite.onComplete = () => {
        if (this.layerGuid && typeof this.onAnimationComplete === 'function') {
          this.onAnimationComplete(this.layerGuid);
        }
      };
      this.layerSprite.onFrameChange = (currentFrame: number) => {
        if (this.layerGuid && typeof this.onAnimationFrameChange === 'function') {
          this.onAnimationFrameChange(this.layerGuid, currentFrame, this.layerSprite?.totalFrames ?? 0);
        }
      };
    }
  }

  async updateSpriteFrame(
    frame: ISpriteFrame,
    layer: ISpriteLayer,
    spriteWidth: number,
    spriteHeight: number,
  ): Promise<void> {
    await this.updateFrame(frame, layer, spriteWidth, spriteHeight);
    if (this.animationLayer) {
      this.setAnimationLayer(this.animationLayer);
    }
  }

  async drawLayer(layer: ISpriteLayer, spriteWidth: number, spriteHeight: number): Promise<void> {
    const layerHash = JSON.stringify([
      spriteWidth,
      spriteHeight,
      layer.x,
      layer.y,
      layer.flipHorizontal,
      layer.flipVertical,
      layer.frames.map((f: ISpriteFrame) => ({
        guid: f.guid,
        x: f.x,
        y: f.y,
      })),
    ]);
    if (this.layerHash !== layerHash) {
      this.layerHash = layerHash;
      this.layerGuid = layer.guid;
      await this.updateFrames(layer, spriteWidth, spriteHeight);
      if (this.animationLayer) {
        this.setAnimationLayer(this.animationLayer);
      }
    }
  }

  private async updateFrames(layer: ISpriteLayer, spriteWidth: number, spriteHeight: number): Promise<void> {
    // Удаление кеша фреймов, которых нет в новом списке
    const framesGuids = layer.frames.map((f: ISpriteFrame) => f.guid);
    for (const frameGuid of this.layerFrames.keys()) {
      if (!framesGuids.includes(frameGuid)) {
        this.layerFrames.delete(frameGuid);
      }
    }
    for (const frame of layer.frames) {
      await this.updateFrame(frame, layer, spriteWidth, spriteHeight);
    }
  }

  private async updateFrame(
    frame: ISpriteFrame,
    layer: ISpriteLayer,
    spriteWidth: number,
    spriteHeight: number,
  ): Promise<void> {
    const frameHash = JSON.stringify([
      spriteWidth,
      spriteHeight,
      layer.x,
      layer.y,
      layer.flipHorizontal,
      layer.flipVertical,
      frame.guid,
      frame.x,
      frame.y,
    ]);
    const cacheFrame = this.layerFrames.get(frame.guid);
    if (cacheFrame) {
      if (cacheFrame.hash === frameHash) {
        return;
      } else {
        this.layerFrames.delete(frame.guid);
      }
    }
    const cacheCanvas = await this.pixiAppService.getFrameCanvasCache(frame.frameId);
    if (!cacheCanvas) {
      console.warn(`Not cacheCanvas for frame "${frame.guid}". Skipping.`);
      return;
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn(`Cannot create 2D context for frame "${frame.guid}". Skipping.`);
      return;
    }
    canvas.width = spriteWidth;
    canvas.height = spriteHeight;
    const x = layer.x + frame.x;
    const y = layer.y + frame.y;
    if (layer.flipHorizontal && layer.flipVertical) {
      ctx.drawImage(cacheCanvas.canvasFlipHV, x, y);
    } else if (layer.flipHorizontal && !layer.flipVertical) {
      ctx.drawImage(cacheCanvas.canvasFlipH, x, y);
    } else if (!layer.flipHorizontal && layer.flipVertical) {
      ctx.drawImage(cacheCanvas.canvasFlipV, x, y);
    } else {
      ctx.drawImage(cacheCanvas.canvas, x, y);
    }
    this.layerFrames.set(frame.guid, { hash: frameHash, canvas });
  }
}
