import { DestroyOptions, FederatedPointerEvent } from 'pixi.js';

import { ISceneObjectFrame } from '~core/interfaces';
import { AlphaSprite } from '~pixijs/components/alpha.sprite';

import { BaseObjectContainer } from '../base-object.container';
import { EMPTY_WHITE_COLOR, SELECT_OBJECT_COLOR } from '../constants';

interface IFrameSprites {
  default: AlphaSprite | null;
  flipHV: AlphaSprite | null;
  flipH: AlphaSprite | null;
  flipV: AlphaSprite | null;
}

type FrameSpriteType = keyof IFrameSprites;

export class FrameObjectContainer extends BaseObjectContainer {
  private frameSrites: IFrameSprites = {
    default: null,
    flipHV: null,
    flipH: null,
    flipV: null,
  };

  private selectedObject = false;

  private currentSprite: AlphaSprite | null = null;

  override destroy(options?: DestroyOptions): void {
    this.frameSrites.default?.destroy();
    this.frameSrites.flipH?.destroy();
    this.frameSrites.flipHV?.destroy();
    this.frameSrites.flipV?.destroy();
    super.destroy(options);
  }

  getObjectAtCursor(e: FederatedPointerEvent): BaseObjectContainer | null {
    if (this.currentSprite?.isHitTest(e)) {
      return this;
    }
    return null;
  }

  selectObject(selected: boolean): void {
    this.selectedObject = selected;
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

  override async drawObject(objectInfo: ISceneObjectFrame): Promise<void> {
    let frameFlip: FrameSpriteType = 'default';
    if (objectInfo.flipHorizontal && objectInfo.flipVertical) {
      frameFlip = 'flipHV';
    } else if (objectInfo.flipHorizontal) {
      frameFlip = 'flipH';
    } else if (objectInfo.flipVertical) {
      frameFlip = 'flipV';
    }
    if (!this.frameSrites[frameFlip]) {
      this.frameSrites[frameFlip] = await this.createSprite(objectInfo.referenceId, frameFlip);
    }
    this.hideSprites(frameFlip);
    this.currentSprite = this.frameSrites[frameFlip] ?? null;
    if (this.currentSprite) {
      this.currentSprite.visible = true;
    }
    this.selectObject(this.selectedObject);
  }

  private async createSprite(frameId: number | null, frameFlip: FrameSpriteType): Promise<AlphaSprite | null> {
    if (!frameId) {
      return null;
    }
    const frameCanvasCache = await this.drawSceneService?.getFrameCanvasCache(frameId);
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
      const sprite = AlphaSprite.createFromCanvas(canvas);
      if (sprite) {
        this.addChild(sprite);
        return sprite;
      }
    }
    return null;
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
}
