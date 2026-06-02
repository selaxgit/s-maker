import { SUColorHelper } from '@selax/utils';
import { Container, DestroyOptions, Graphics } from 'pixi.js';

import { ISpriteFrame, ISpriteLayer } from '~core/interfaces';
import { PixiAppService } from '~core/services';

import { SpriteAdjustmentFrameContainer } from './sprite-adjustment-frame.container';

export class SpriteAdjustmentLayerContainer extends Container {
  private readonly gLayerRect = new Graphics();

  private defBgColor: string | null = null;

  private layerRectWidth = 0;

  private layerRectHeight = 0;

  private flipHorizontal: boolean = false;

  private flipVertical: boolean = false;

  private layerRectFillColor: number | null = null;

  private readonly layersFrames = new Map<string, SpriteAdjustmentFrameContainer>();

  constructor(
    private readonly defLayer: ISpriteLayer,
    private readonly pixiAppService: PixiAppService,
  ) {
    super();
    this.sortableChildren = true;
    this.addChild(this.gLayerRect);
  }

  override destroy(options?: DestroyOptions): void {
    this.layersFrames.forEach((container: SpriteAdjustmentFrameContainer) => {
      container.destroy();
    });
    this.gLayerRect.destroy();
    super.destroy(options);
  }

  async updateFrame(frame: ISpriteFrame): Promise<void> {
    this.layersFrames.get(frame.guid)?.updateFrame(this.flipHorizontal, this.flipVertical, frame);
  }

  async updateLayer(layer: ISpriteLayer): Promise<void> {
    this.x = layer.x;
    this.y = layer.y;
    this.zIndex = layer.zIndex;
    this.visible = layer.visible;
    if (this.defBgColor !== layer.bgColor) {
      this.defBgColor = layer.bgColor;
      this.layerRectFillColor = layer.bgColor ? SUColorHelper.hex2hexadecimal(layer.bgColor) : null;
      this.drawLayerRect();
    }
    // Инициализация новых фреймов
    const noInitFrames: ISpriteFrame[] = [];
    for (const frame of layer.frames) {
      if (!this.layersFrames.has(frame.guid)) {
        noInitFrames.push(frame);
      }
    }
    if (noInitFrames.length > 0) {
      await this.initializeFrames(noInitFrames);
    }
    if (this.flipHorizontal !== layer.flipHorizontal || this.flipVertical !== layer.flipVertical) {
      this.flipHorizontal = layer.flipHorizontal;
      this.flipVertical = layer.flipVertical;
    }
    for (const frame of layer.frames) {
      await this.layersFrames.get(frame.guid)?.updateFrame(this.flipHorizontal, this.flipVertical, frame);
    }
  }

  async initializeLayer(): Promise<void> {
    this.x = this.defLayer.x;
    this.y = this.defLayer.y;
    this.zIndex = this.defLayer.zIndex;
    this.visible = this.defLayer.visible;
    this.defBgColor = this.defLayer.bgColor;
    this.flipHorizontal = this.defLayer.flipHorizontal;
    this.flipVertical = this.defLayer.flipVertical;
    this.layerRectFillColor = this.defBgColor ? SUColorHelper.hex2hexadecimal(this.defBgColor) : null;
    await this.initializeFrames(this.defLayer.frames);
    this.calculateLayerRect();
    this.drawLayerRect();
  }

  private async initializeFrames(frames: ISpriteFrame[]): Promise<void> {
    for (const frame of frames) {
      const adjFrame = new SpriteAdjustmentFrameContainer(frame, this.pixiAppService, () =>
        this.reCalculateLayerRect(),
      );
      this.layersFrames.set(frame.guid, adjFrame);
      this.addChild(adjFrame);
      await adjFrame.initialize(this.flipHorizontal, this.flipVertical);
    }
  }

  private reCalculateLayerRect(): void {
    this.calculateLayerRect();
    this.drawLayerRect();
  }

  private calculateLayerRect(): void {
    const widths: number[] = [];
    const heights: number[] = [];
    for (const frame of this.layersFrames.values()) {
      widths.push(frame.width + frame.x);
      heights.push(frame.height + frame.y);
    }
    this.layerRectWidth = widths.length > 0 ? Math.max(...widths) : 0;
    this.layerRectHeight = heights.length > 0 ? Math.max(...heights) : 0;
  }

  private drawLayerRect(): void {
    this.gLayerRect.clear().rect(0, 0, this.layerRectWidth, this.layerRectHeight);
    if (this.layerRectFillColor !== null) {
      this.gLayerRect.fill(this.layerRectFillColor);
    }
  }
}
