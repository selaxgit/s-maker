import { AnimatedSprite, AnimatedSpriteFrames, Container, DestroyOptions, FrameObject, Texture } from 'pixi.js';

import { ISpriteAnimationLayer, ISpriteLayer } from '~core/interfaces';

import { SBDrawSceneService } from '../../services';
import { EMPTY_WHITE_COLOR, SELECT_OBJECT_COLOR } from './constants';

export class SpriteLayerContainer extends Container {
  onAnimationComplete: ((layerGuid: string) => void) | null = null;

  onObjectMouseMove: (() => void) | null = null;

  onObjectMouseLeave: (() => void) | null = null;

  private layerGuid: string | null = null;

  private readonly layerFrames = new Map<string, HTMLCanvasElement>();

  private layerSprite: AnimatedSprite | null = null;

  constructor(private readonly drawSceneService: SBDrawSceneService) {
    super();
  }

  override destroy(options?: DestroyOptions): void {
    if (this.layerSprite) {
      this.layerSprite.destroy();
    }
    this.layerFrames.clear();
    super.destroy(options);
  }

  isPlaying(): boolean {
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

  selectedSprite(selected: boolean): void {
    if (this.layerSprite) {
      this.layerSprite.tint = selected ? SELECT_OBJECT_COLOR : EMPTY_WHITE_COLOR;
    }
  }

  setSpriteAnimationLayer(layer: ISpriteAnimationLayer): void {
    if (this.layerSprite) {
      this.layerSprite.destroy();
      this.layerSprite = null;
    }
    const failAllFrameSpeed = Object.values(layer.frames).some((frame: number | null) => frame === null);
    const spriteFrames: AnimatedSpriteFrames = [];
    for (const [frameGuid, canvas] of this.layerFrames.entries()) {
      if (failAllFrameSpeed) {
        (spriteFrames as Texture[]).push(Texture.from(canvas));
      } else if (layer.frames[frameGuid]) {
        (spriteFrames as FrameObject[]).push({ texture: Texture.from(canvas), time: layer.frames[frameGuid] });
      }
    }
    if (spriteFrames.length > 0) {
      this.layerSprite = new AnimatedSprite(spriteFrames);
      this.layerSprite.loop = layer.loop;
      this.layerSprite.eventMode = 'static';
      if (failAllFrameSpeed && layer.speed) {
        this.layerSprite.animationSpeed = layer.speed;
      }
      this.addChild(this.layerSprite);
      this.layerSprite.onComplete = () => {
        if (typeof this.onAnimationComplete === 'function' && this.layerGuid) {
          this.onAnimationComplete(this.layerGuid);
        }
      };
      this.layerSprite
        .on('pointermove', () => {
          if (typeof this.onObjectMouseMove === 'function') {
            this.onObjectMouseMove();
          }
        })
        .on('pointerleave', () => {
          if (typeof this.onObjectMouseLeave === 'function') {
            this.onObjectMouseLeave();
          }
        });
    }
  }

  async drawLayer(layer: ISpriteLayer, spriteWidth: number, spriteHeight: number): Promise<void> {
    this.layerGuid = layer.guid;
    for (const frame of layer.frames) {
      const frameCanvasCache = await this.drawSceneService.getFrameCanvasCache(frame.frameId);
      if (!frameCanvasCache) {
        continue;
      }
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.warn(`Cannot create 2D context for frame "${frame.guid}". Skipping.`);
        continue;
      }
      canvas.width = spriteWidth;
      canvas.height = spriteHeight;
      const x = layer.x + frame.x;
      const y = layer.y + frame.y;
      if (layer.flipHorizontal && layer.flipVertical) {
        ctx.drawImage(frameCanvasCache.canvasFlipHV, x, y);
      } else if (layer.flipHorizontal && !layer.flipVertical) {
        ctx.drawImage(frameCanvasCache.canvasFlipH, x, y);
      } else if (!layer.flipHorizontal && layer.flipVertical) {
        ctx.drawImage(frameCanvasCache.canvasFlipV, x, y);
      } else {
        ctx.drawImage(frameCanvasCache.canvas, x, y);
      }
      this.layerFrames.set(frame.guid, canvas);
    }
  }
}
