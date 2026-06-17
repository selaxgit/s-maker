import { ISUCoords } from '@selax/utils';
import { Container, DestroyOptions, Sprite, Texture } from 'pixi.js';

import { ISceneObjectFrame } from '~core/interfaces';

import { SBDrawSceneService } from '../../services';
import { EMPTY_WHITE_COLOR, SELECT_OBJECT_COLOR } from './constants';
import { ISceneDragObject } from './interfaces';

interface IFrameSprites {
  default: Sprite | null;
  flipHV: Sprite | null;
  flipH: Sprite | null;
  flipV: Sprite | null;
}

type FrameSpriteType = keyof IFrameSprites;

export class FrameSpriteContainer extends Container implements ISceneDragObject {
  onObjectMouseMove: ((guidObject: string, object: FrameSpriteContainer) => void) | null = null;

  onObjectMouseLeave: (() => void) | null = null;

  private frameSrites: IFrameSprites = {
    default: null,
    flipHV: null,
    flipH: null,
    flipV: null,
  };

  constructor(
    readonly guidObject: string,
    private readonly drawSceneService: SBDrawSceneService,
  ) {
    super();
  }

  override destroy(options?: DestroyOptions): void {
    this.frameSrites.default?.destroy();
    this.frameSrites.flipH?.destroy();
    this.frameSrites.flipHV?.destroy();
    this.frameSrites.flipV?.destroy();
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
    if (this.frameSrites.default) {
      this.frameSrites.default.tint = selected ? SELECT_OBJECT_COLOR : EMPTY_WHITE_COLOR;
    }
    if (this.frameSrites.flipH) {
      this.frameSrites.flipH.tint = selected ? SELECT_OBJECT_COLOR : EMPTY_WHITE_COLOR;
    }
    if (this.frameSrites.flipHV) {
      this.frameSrites.flipHV.tint = selected ? SELECT_OBJECT_COLOR : EMPTY_WHITE_COLOR;
    }
    if (this.frameSrites.flipV) {
      this.frameSrites.flipV.tint = selected ? SELECT_OBJECT_COLOR : EMPTY_WHITE_COLOR;
    }
  }

  async updateFrame(frameInfo: ISceneObjectFrame, selected: boolean): Promise<void> {
    let frameFlip: FrameSpriteType = 'default';
    if (frameInfo.flipHorizontal && frameInfo.flipVertical) {
      frameFlip = 'flipHV';
    } else if (frameInfo.flipHorizontal) {
      frameFlip = 'flipH';
    } else if (frameInfo.flipVertical) {
      frameFlip = 'flipV';
    }
    if (!this.frameSrites[frameFlip]) {
      this.frameSrites[frameFlip] = await this.createSprite(frameInfo.referenceId, frameFlip);
    }
    this.hideSprites(frameFlip);
    this.selectedObject(selected);
    const frameSrite = this.frameSrites[frameFlip] ?? null;
    if (frameSrite) {
      frameSrite.x = frameInfo.x;
      frameSrite.y = frameInfo.y;
      frameSrite.zIndex = frameInfo.zIndex;
      frameSrite.visible = frameInfo.visible;
    }
  }

  private hideSprites(excludeFlip: FrameSpriteType): void {
    if (this.frameSrites.default && excludeFlip !== 'default') {
      this.frameSrites.default.visible = false;
    }
    if (this.frameSrites.flipH && excludeFlip !== 'flipH') {
      this.frameSrites.flipH.visible = false;
    }
    if (this.frameSrites.flipHV && excludeFlip !== 'flipHV') {
      this.frameSrites.flipHV.visible = false;
    }
    if (this.frameSrites.flipV && excludeFlip !== 'flipV') {
      this.frameSrites.flipV.visible = false;
    }
  }

  private async createSprite(frameId: number | null, frameFlip: FrameSpriteType): Promise<Sprite | null> {
    if (!frameId) {
      return null;
    }
    const frameCanvasCache = await this.drawSceneService.getFrameCanvasCache(frameId);
    if (!frameCanvasCache) {
      return null;
    }
    let canvas: HTMLCanvasElement | null = null;
    switch (frameFlip) {
      case 'default':
        canvas = frameCanvasCache.canvas;
        break;
      case 'flipH':
        canvas = frameCanvasCache.canvasFlipH;
        break;
      case 'flipHV':
        canvas = frameCanvasCache.canvasFlipHV;
        break;
      case 'flipV':
        canvas = frameCanvasCache.canvasFlipV;
        break;
    }
    if (canvas) {
      const sprite = new Sprite(Texture.from(canvas));
      sprite.eventMode = 'static';
      sprite
        .on('pointermove', () => {
          if (typeof this.onObjectMouseMove === 'function') {
            this.onObjectMouseMove(this.guidObject, this);
          }
        })
        .on('pointerleave', () => {
          if (typeof this.onObjectMouseLeave === 'function') {
            this.onObjectMouseLeave();
          }
        });
      this.addChild(sprite);
      return sprite;
    }
    return null;
  }
}
