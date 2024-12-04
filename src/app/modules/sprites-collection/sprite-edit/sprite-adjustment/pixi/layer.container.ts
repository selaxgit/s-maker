import { Container, Graphics } from 'pixi.js';

import { ColorHelper } from '../../../../../common/helpers';
import { ISpriteFrame, ISpriteLayersListItem } from '../../../../../common/interfaces';
import { FramesCacheService } from '../../../../../common/services/cache';
import { FrameContainer } from './frame.container';

export class LayerContainer extends Container {
  private readonly gLayerRect = new Graphics();

  private frames: Map<number, FrameContainer> = new Map();

  constructor(
    private readonly framesCacheService: FramesCacheService,
    layerInfo: ISpriteLayersListItem,
  ) {
    super();
    this.addChild(this.gLayerRect);
    this.updateLayer(layerInfo);
  }

  public async updateLayer(layerInfo: ISpriteLayersListItem): Promise<void> {
    const framesIds: number[] = [];
    for (const frame of layerInfo.frames) {
      framesIds.push(frame.id);
      if (this.frames.has(frame.id)) {
        this.frames.get(frame.id)?.updateFrame(frame, layerInfo.flipHorizontal, layerInfo.flipVertical);
      } else {
        (await this.addFrame(frame)).updateFrame(frame, layerInfo.flipHorizontal, layerInfo.flipVertical);
      }
    }
    for (const id of this.frames.keys()) {
      if (!framesIds.includes(id)) {
        this.frames.get(id)?.destroy(true);
        this.frames.delete(id);
      }
    }
    this.position.set(layerInfo.x, layerInfo.y);
    this.zIndex = layerInfo.zIndex;
    this.visible = layerInfo.visible;
    this.updateLayerRect(layerInfo.bgColor);
  }

  private async addFrame(frameInfo: ISpriteFrame): Promise<FrameContainer> {
    const frameCache = await this.framesCacheService.getCache({
      id: frameInfo.id,
      file: frameInfo.file,
    });
    const frame = new FrameContainer(frameCache);
    this.addChild(frame);
    this.frames.set(frameInfo.id, frame);
    return frame;
  }

  private updateLayerRect(bgColor: string | null): void {
    this.gLayerRect.clear();
    if (bgColor) {
      this.gLayerRect.rect(0, 0, this.width, this.height).fill(ColorHelper.hex2hexadecimal(bgColor));
    }
  }
}
