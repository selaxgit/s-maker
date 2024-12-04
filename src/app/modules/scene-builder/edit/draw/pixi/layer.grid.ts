import { Sprite, Texture } from 'pixi.js';

import { ISceneObject, IStoreKeyCanvas, ITilesGrid, ITilesGridItem } from '../../../../../common/interfaces';
import { BaseLayer } from './base.layer';

export class LayerGrid extends BaseLayer {
  private gridSprite: Sprite | null = null;

  constructor(
    private readonly grid: ITilesGrid,
    private readonly framesStore: IStoreKeyCanvas,
  ) {
    super();
  }

  public override async updateLayer(object: ISceneObject): Promise<void> {
    super.updateLayer(object);
    if (!this.gridSprite) {
      this.drawGrid(this.grid, this.framesStore);
    }
  }

  private drawGrid(grid: ITilesGrid, framesStore: IStoreKeyCanvas): void {
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = grid.mapInfo.width * grid.tileInfo.width;
    gridCanvas.height = grid.mapInfo.height * grid.tileInfo.height;
    const ctxGrid = gridCanvas.getContext('2d');
    if (!ctxGrid) {
      console.error('LayerGrid (drawGrid): failed ctxGrid');
      return;
    }
    const items = [...grid.items];
    items.sort((a: ITilesGridItem, b: ITilesGridItem) => b.zIndex - a.zIndex);
    for (const item of items) {
      if (!item.referenceId || !framesStore[item.referenceId]) {
        return;
      }
      let width = framesStore[item.referenceId].width;
      let height = framesStore[item.referenceId].height;
      if (item.stretch) {
        width = grid.tileInfo.width;
        height = grid.tileInfo.height;
      }
      const itemCanvas = document.createElement('canvas');
      itemCanvas.width = width;
      itemCanvas.height = height;
      const ctxItem = itemCanvas.getContext('2d');
      if (!ctxItem) {
        console.error('LayerGrid (drawGrid): failed ctxItem');
        continue;
      }
      ctxItem.drawImage(
        framesStore[item.referenceId],
        0,
        0,
        framesStore[item.referenceId].width,
        framesStore[item.referenceId].height,
        0,
        0,
        width,
        height,
      );
      ctxGrid.drawImage(
        itemCanvas,
        0,
        0,
        itemCanvas.width,
        itemCanvas.height,
        item.x * grid.tileInfo.width,
        item.y * grid.tileInfo.height,
        itemCanvas.width,
        itemCanvas.height,
      );
    }
    this.gridSprite = new Sprite(Texture.from(gridCanvas));
    this.addChild(this.gridSprite);
  }
}
