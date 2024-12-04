import { Container } from 'pixi.js';

import { ISpriteLayersListItem } from '../../../../../common/interfaces';
import { FramesCacheService } from '../../../../../common/services/cache';
import { LayerContainer } from './layer.container';

export class AdjustmentContainer extends Container {
  private layers: Map<number, LayerContainer> = new Map();

  constructor(private readonly framesCacheService: FramesCacheService) {
    super();
    this.sortableChildren = true;
  }

  public async updateLayers(layers: ISpriteLayersListItem[]): Promise<void> {
    const layersIds: number[] = [];
    for (const layer of layers) {
      layersIds.push(layer.id);
      if (this.layers.has(layer.id)) {
        this.layers.get(layer.id)?.updateLayer(layer);
      } else {
        this.addLayer(layer);
      }
    }
    for (const id of this.layers.keys()) {
      if (!layersIds.includes(id)) {
        this.layers.get(id)?.destroy(true);
        this.layers.delete(id);
      }
    }
  }

  private addLayer(layerInfo: ISpriteLayersListItem): void {
    const layer = new LayerContainer(this.framesCacheService, layerInfo);
    this.addChild(layer);
    this.layers.set(layerInfo.id, layer);
  }
}
