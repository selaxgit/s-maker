import { Container, DestroyOptions } from 'pixi.js';

import { ISpriteFrame, ISpriteLayer } from '~core/interfaces';
import { PixiAppService } from '~core/services';

import { SpriteAdjustmentLayerContainer } from './sprite-adjustment-layer.container';

export class SpriteAdjustmentContainer extends Container {
  private readonly spriteLayers = new Map<string, SpriteAdjustmentLayerContainer>();

  constructor(private readonly pixiAppService: PixiAppService) {
    super();
    this.sortableChildren = true;
  }

  override destroy(options?: DestroyOptions): void {
    this.spriteLayers.forEach((container: SpriteAdjustmentLayerContainer) => {
      container.destroy();
    });
    super.destroy(options);
  }

  async updateSpriteFrame(frame: ISpriteFrame | null, layer: ISpriteLayer | null): Promise<void> {
    if (frame && layer) {
      this.spriteLayers.get(layer.guid)?.updateFrame(frame);
    }
  }

  async updateSpriteLayersList(layers: ISpriteLayer[]): Promise<void> {
    // Удаление слоев, которых нет в новом списке
    const layersGuids = layers.map((l: ISpriteLayer) => l.guid);
    for (const [layerGuid, adjLayer] of this.spriteLayers.entries()) {
      if (!layersGuids.includes(layerGuid)) {
        this.spriteLayers.delete(layerGuid);
        adjLayer.destroy();
      }
    }
    // обновление видимости слоев и фреймов и добавление новых слоев
    for (const layer of layers) {
      const adjLayer = this.spriteLayers.get(layer.guid);
      if (adjLayer) {
        await this.updateSpriteLayer(layer);
      } else {
        const newAdjLayer = new SpriteAdjustmentLayerContainer(layer, this.pixiAppService);
        this.spriteLayers.set(layer.guid, newAdjLayer);
        this.addChild(newAdjLayer);
        await newAdjLayer.initializeLayer();
      }
    }
  }

  async updateSpriteLayer(layer: ISpriteLayer | null): Promise<void> {
    if (layer) {
      const adjLayer = this.spriteLayers.get(layer.guid);
      if (adjLayer) {
        await adjLayer.updateLayer(layer);
      }
    }
  }

  async initializeLayers(layers: ISpriteLayer[]): Promise<void> {
    for (const layer of layers) {
      const adjLayer = new SpriteAdjustmentLayerContainer(layer, this.pixiAppService);
      this.spriteLayers.set(layer.guid, adjLayer);
      this.addChild(adjLayer);
      await adjLayer.initializeLayer();
    }
  }
}
