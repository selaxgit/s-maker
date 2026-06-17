import { Container } from 'pixi.js';

import { SceneLayerTypeEnum } from '~core/constants';
import { ISceneObjectFrame } from '~core/interfaces';

import { SBDrawSceneService } from '../../services';
import { FrameSpriteContainer } from './frame-sprite.container';
import { IPixiSceneLayer, ISceneLayerMouseEvent } from './interfaces';

export class LayerFramesContainer extends Container implements IPixiSceneLayer {
  typeLayer: SceneLayerTypeEnum | null = null;

  guidLayer: string | null = null;

  onObjectMouseMove: ((info: ISceneLayerMouseEvent) => void) | null = null;

  onObjectMouseLeave: (() => void) | null = null;

  private sprites = new Map<string, FrameSpriteContainer>();

  private selectedObjectGuid: string | null = null;

  constructor(private readonly drawSceneService: SBDrawSceneService) {
    super();
  }

  selectedObject(guidObject: string | null): void {
    this.selectedObjectGuid = guidObject;
    for (const [guid, frameSpriteContainer] of this.sprites.entries()) {
      frameSpriteContainer.selectedObject(guid === guidObject);
    }
  }

  async drawObjects(objectsInfo: ISceneObjectFrame[]): Promise<void> {
    const guids = objectsInfo.map((sprite: ISceneObjectFrame) => sprite.guid);
    for (const [guid, frameSpriteContainer] of this.sprites.entries()) {
      if (!guids.includes(guid)) {
        this.sprites.delete(guid);
        frameSpriteContainer.destroy();
      }
    }
    for (const frameInfo of objectsInfo) {
      let frameSpriteContainer = this.sprites.get(frameInfo.guid);
      if (!frameSpriteContainer) {
        frameSpriteContainer = new FrameSpriteContainer(frameInfo.guid, this.drawSceneService);
        this.sprites.set(frameInfo.guid, frameSpriteContainer);
        this.addChild(frameSpriteContainer);
        frameSpriteContainer.onObjectMouseMove = (guidObject: string, object: FrameSpriteContainer) => {
          if (typeof this.onObjectMouseMove === 'function') {
            this.onObjectMouseMove({
              typeLayer: this.typeLayer!,
              guidLayer: this.guidLayer!,
              guidObject,
              object,
              data: null,
            });
          }
        };
        frameSpriteContainer.onObjectMouseLeave = () => {
          if (typeof this.onObjectMouseLeave === 'function') {
            this.onObjectMouseLeave();
          }
        };
      }
      await frameSpriteContainer.updateFrame(frameInfo, frameInfo.guid === this.selectedObjectGuid);
    }
  }

  /* private async updateFrame(frameInfo: ISceneObjectFrame): Promise<void> {
    let frameSrites = this.sprites.get(frameInfo.guid);
    let frameFlip: FrameSpriteType = 'default';
    if (frameInfo.flipHorizontal && frameInfo.flipVertical) {
      frameFlip = 'flipHV';
    } else if (frameInfo.flipHorizontal) {
      frameFlip = 'flipH';
    } else if (frameInfo.flipVertical) {
      frameFlip = 'flipV';
    }
    let frameSrite: Sprite | null;
    if (!frameSrites) {
      frameSrite = await this.createSprite(frameInfo.referenceId, frameFlip);
      frameSrites = {
        default: null,
        flipHV: null,
        flipH: null,
        flipV: null,
      };
      frameSrites[frameFlip] = frameSrite;
      this.sprites.set(frameInfo.guid, frameSrites);
    } else {
      if (!frameSrites[frameFlip]) {
        frameSrites[frameFlip] = await this.createSprite(frameInfo.referenceId, frameFlip);
      }
      frameSrite = frameSrites[frameFlip] ?? null;
    }
    this.hideSprites(frameSrites, frameFlip);
    this.selectedFrame(frameSrites, frameInfo.guid === this.selectedObjectGuid);
    if (frameSrite) {
      frameSrite.x = frameInfo.x;
      frameSrite.y = frameInfo.y;
      frameSrite.zIndex = frameInfo.zIndex;
      frameSrite.visible = frameInfo.visible;
    }
  }

  private selectedFrame(frameSrites: IFrameSprites, selected: boolean): void {
    if (frameSrites.default) {
      frameSrites.default.tint = selected ? SELECT_OBJECT_COLOR : EMPTY_WHITE_COLOR;
    }
    if (frameSrites.flipH) {
      frameSrites.flipH.tint = selected ? SELECT_OBJECT_COLOR : EMPTY_WHITE_COLOR;
    }
    if (frameSrites.flipHV) {
      frameSrites.flipHV.tint = selected ? SELECT_OBJECT_COLOR : EMPTY_WHITE_COLOR;
    }
    if (frameSrites.flipV) {
      frameSrites.flipV.tint = selected ? SELECT_OBJECT_COLOR : EMPTY_WHITE_COLOR;
    }
  }

  private hideSprites(frameSrites: IFrameSprites, excludeFlip: FrameSpriteType): void {
    if (frameSrites.default && excludeFlip !== 'default') {
      frameSrites.default.visible = false;
    }
    if (frameSrites.flipH && excludeFlip !== 'flipH') {
      frameSrites.flipH.visible = false;
    }
    if (frameSrites.flipHV && excludeFlip !== 'flipHV') {
      frameSrites.flipHV.visible = false;
    }
    if (frameSrites.flipV && excludeFlip !== 'flipV') {
      frameSrites.flipV.visible = false;
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
      this.addChild(sprite);
      return sprite;
    }
    return null;
  } */
}
