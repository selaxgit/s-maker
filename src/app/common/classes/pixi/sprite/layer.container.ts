import { AnimatedSprite, AnimatedSpriteFrames, Container, FrameObject, Texture } from 'pixi.js';
import { Subject } from 'rxjs';

import { ISpriteAnimationLayer, ISpriteLayersListItem } from '../../../interfaces';
import { FramesCacheService } from '../../../services/cache';
import { ISpriteAnimationFrameEvent } from './interfaces';

export class LayerContainer extends Container {
  public animationCompleteEvent = new Subject<void>();

  public spriteMouseEnterEvent = new Subject<AnimatedSprite>();

  public spriteMouseLeaveEvent = new Subject<AnimatedSprite>();

  public animationFrameChangeEvent = new Subject<ISpriteAnimationFrameEvent>();

  private cachedTextures: Map<string, Texture> = new Map();

  private animatedSprite: AnimatedSprite | null = null;

  private layerInfo: ISpriteLayersListItem | null = null;

  private layerStateInfo: ISpriteAnimationLayer | null = null;

  constructor(
    private readonly framesCacheService: FramesCacheService,
    private readonly spriteWidth: number,
    private readonly spriteHeight: number,
  ) {
    super();
  }

  public set play(val: boolean) {
    if (this.animatedSprite) {
      if (val) {
        this.animatedSprite.play();
      } else {
        this.animatedSprite.gotoAndStop(0);
      }
    }
  }

  public get playing(): boolean {
    return this.animatedSprite?.playing ?? false;
  }

  public setCurrentFrame(frame: number): void {
    if (this.animatedSprite) {
      this.animatedSprite.gotoAndStop(frame);
    }
  }

  public async updateLayerInfo(layerInfo: ISpriteLayersListItem): Promise<void> {
    if (!this.layerInfo || JSON.stringify(this.layerInfo) !== JSON.stringify(layerInfo)) {
      await this.initialize(layerInfo);
      if (this.layerStateInfo) {
        const playing = this.playing;
        this.setLayerState(this.layerStateInfo);
        this.play = playing;
      }
    }
  }

  public setLayerState(layerInfo: ISpriteAnimationLayer): void {
    this.layerStateInfo = layerInfo;
    if (this.animatedSprite) {
      this.animatedSprite.destroy();
    }
    const frameObjects: AnimatedSpriteFrames = [];
    let hasAllFrameSpeed = true;
    for (const frame of layerInfo.frames) {
      if (frame.speed === null) {
        hasAllFrameSpeed = false;
        break;
      }
    }
    for (const frame of layerInfo.frames) {
      const cacheKey = this.getTextureCacheKey(
        frame.id,
        this.layerInfo?.flipHorizontal ?? false,
        this.layerInfo?.flipVertical ?? false,
      );
      if (this.cachedTextures.has(cacheKey)) {
        if (hasAllFrameSpeed && frame.speed !== null) {
          (frameObjects as FrameObject[]).push({
            texture: this.cachedTextures.get(cacheKey) as Texture,
            time: frame.speed,
          });
        } else {
          (frameObjects as Texture[]).push(this.cachedTextures.get(cacheKey) as Texture);
        }
      }
    }
    if (frameObjects.length > 0) {
      this.animatedSprite = new AnimatedSprite(frameObjects);
      this.animatedSprite.loop = layerInfo.loop;
      this.animatedSprite.animationSpeed = layerInfo.speed;
      this.addChild(this.animatedSprite);
      this.animatedSprite.onComplete = () => {
        this.animationCompleteEvent.next();
      };
      this.animatedSprite.onFrameChange = (currentFrame: number) => {
        this.animationFrameChangeEvent.next({
          current: currentFrame,
          total: this.animatedSprite?.totalFrames ?? 0,
        });
      };
      this.animatedSprite.eventMode = 'static';
      this.animatedSprite
        .on('pointerenter', () => {
          if (this.animatedSprite) {
            this.spriteMouseEnterEvent.next(this.animatedSprite);
          }
        })
        .on('pointerleave', () => {
          if (this.animatedSprite) {
            this.spriteMouseLeaveEvent.next(this.animatedSprite);
          }
        });
    }
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
  }

  public async initialize(layerInfo: ISpriteLayersListItem): Promise<void> {
    this.layerInfo = layerInfo;
    this.zIndex = layerInfo.zIndex;
    if (layerInfo.frames.length === 0) {
      return;
    }
    for (const frame of layerInfo.frames) {
      const cacheKey = this.getTextureCacheKey(
        frame.id,
        this.layerInfo?.flipHorizontal ?? false,
        this.layerInfo?.flipVertical ?? false,
      );
      if (this.cachedTextures.has(cacheKey)) {
        continue;
      }
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('layer.container:updateLayer - canvas has not ctx');
      }
      canvas.width = this.spriteWidth;
      canvas.height = this.spriteHeight;
      const frameCache = await this.framesCacheService.getCache({
        id: frame.id,
        file: frame.file,
      });
      const x = layerInfo.x + frame.x;
      const y = layerInfo.y + frame.y;
      if (layerInfo.flipHorizontal && layerInfo.flipVertical && frameCache.canvasFlipHV) {
        ctx.drawImage(frameCache.canvasFlipHV, x, y);
      } else if (layerInfo.flipHorizontal && !layerInfo.flipVertical && frameCache.canvasFlipH) {
        ctx.drawImage(frameCache.canvasFlipH, x, y);
      } else if (!layerInfo.flipHorizontal && layerInfo.flipVertical && frameCache.canvasFlipV) {
        ctx.drawImage(frameCache.canvasFlipV, x, y);
      } else if (frameCache.canvas) {
        ctx.drawImage(frameCache.canvas, x, y);
      }
      this.cachedTextures.set(cacheKey, Texture.from(canvas));
    }
  }

  private getTextureCacheKey(frameId: number, flipHorizontal: boolean, flipVertical: boolean): string {
    return String(`${frameId}-${flipHorizontal}-${flipVertical}`);
  }
}
