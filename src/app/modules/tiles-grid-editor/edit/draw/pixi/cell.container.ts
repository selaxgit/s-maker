/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Container, Graphics, Sprite, Texture } from 'pixi.js';

import { IStoreKeyCanvas, ITilesGridItem, IViewTile } from '../../../../../common/interfaces';

export class CellContainer extends Container {
  private rectBg = new Graphics();

  private tiles: Map<number, Sprite> = new Map();

  constructor(
    public tileX: number,
    public tileY: number,
    public tileWidth: number,
    public tileHeight: number,
  ) {
    super();
    this.eventMode = 'static';
    this.sortableChildren = true;
    this.rectBg.zIndex = 10;
    this.addChild(this.rectBg);
  }

  public drawTiles(tiles: ITilesGridItem[], storeKeyCanvas: IStoreKeyCanvas): void {
    let needClear = true;
    for (const tile of tiles) {
      if (tile.x === this.tileX && tile.y === this.tileY) {
        needClear = false;
        this.drawTile(tile, storeKeyCanvas);
      }
    }
    if (needClear && this.tiles.size > 0) {
      this.clearTiles();
    }
  }

  public drawTile(tileInfo: ITilesGridItem, storeKeyCanvas: IStoreKeyCanvas): void {
    let sprite: Sprite;
    const tileId = Number(tileInfo.referenceId);
    if (this.tiles.has(tileId)) {
      sprite = this.tiles.get(tileId) as Sprite;
    } else {
      if (!storeKeyCanvas[tileId]) {
        return;
      }
      const texture = Texture.from(storeKeyCanvas[tileId]);
      sprite = new Sprite(texture);
    }

    sprite.zIndex = tileInfo.zIndex;
    if (tileInfo.flipVertical) {
      sprite.anchor.y = 1;
      sprite.scale.y = -1;
    } else {
      sprite.anchor.y = 0;
      sprite.scale.y = 1;
    }
    if (tileInfo.flipHorizontal) {
      sprite.anchor.x = 1;
      sprite.scale.x = -1;
    } else {
      sprite.anchor.x = 0;
      sprite.scale.x = 1;
    }
    sprite.width = tileInfo.stretch ? this.tileWidth : sprite.texture.width;
    sprite.height = tileInfo.stretch ? this.tileHeight : sprite.texture.height;
    if (!this.tiles.has(tileId)) {
      this.tiles.set(tileId, sprite);
      this.addChild(sprite);
    }
  }

  public addTile(tile: IViewTile, isModeOverlay: boolean): boolean {
    if (this.tiles.has(tile.id) || !tile.canvas) {
      return false;
    }
    if (!isModeOverlay) {
      this.clearTiles();
    }
    const texture = Texture.from(tile.canvas);
    const sprite = new Sprite(texture);
    this.addChild(sprite);
    this.tiles.set(tile.id, sprite);
    return true;
  }

  public showBorder(visible: boolean, color: number = 0xc6c6c6, alpha: number = 0.2): void {
    this.rectBg
      .clear()
      .rect(1, 1, this.tileWidth - 2, this.tileHeight - 2)
      .fill({
        color: 0x000000,
        alpha: 0.001,
      })
      .stroke({ width: 1, color: color, alpha: visible ? alpha : 0.001 });
  }

  public clearTiles(): boolean {
    const ret = this.tiles.size > 0;
    this.tiles.forEach((sprite: Sprite) => sprite.destroy());
    this.tiles.clear();
    return ret;
  }
}
