/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ISUCoords } from '@selax/utils';
import { Container, DestroyOptions, Graphics, Sprite, Texture } from 'pixi.js';

import { ITilesGridItem } from '~core/interfaces';
import { PixiAppService } from '~core/services';
import { ICacheFramesCanvas } from '~services/cache-frames-canvas.service';

interface ITileStore {
  flipHorizontal: boolean;
  flipVertical: boolean;
  stretch: boolean;
  zIndex: number;
  cache: ICacheFramesCanvas | null;
  sprite: Sprite;
}

export class CellContainer extends Container {
  private rectBg = new Graphics();

  private tilesist = new Map<number, ITileStore>();

  constructor(
    readonly coords: ISUCoords,
    private readonly tileWidth: number,
    private readonly tileHeight: number,
  ) {
    super();
    this.eventMode = 'static';
    this.sortableChildren = true;
    this.rectBg.zIndex = 100;
    this.addChild(this.rectBg);
  }

  override destroy(options?: DestroyOptions): void {
    this.rectBg.destroy();
    this.clearTiles();
    super.destroy(options);
  }

  async drawTiles(items: ITilesGridItem[], pixiAppService: PixiAppService): Promise<void> {
    for (const item of items) {
      await this.drawTile(item, pixiAppService);
    }
    const frameIds = items.map((i: ITilesGridItem) => i.frameId);
    this.tilesist.forEach((cell: ITileStore, key: number) => {
      if (!frameIds.includes(key)) {
        cell.sprite.destroy();
        this.tilesist.delete(key);
      }
    });
  }

  async drawTile(item: ITilesGridItem, pixiAppService: PixiAppService): Promise<void> {
    const cacheStore = this.tilesist.get(item.frameId);
    if (cacheStore) {
      if (cacheStore.flipHorizontal !== item.flipHorizontal || cacheStore.flipVertical !== item.flipVertical) {
        if (cacheStore.sprite) {
          cacheStore.sprite.destroy();
        }
        const sprite = this.createSprite(item, cacheStore.cache);
        if (sprite) {
          cacheStore.flipHorizontal = item.flipHorizontal;
          cacheStore.flipVertical = item.flipVertical;
          cacheStore.sprite = sprite;
          this.tilesist.set(item.frameId, cacheStore);
          this.addChild(sprite);
        } else {
          this.tilesist.delete(item.frameId);
        }
      } else {
        let needUpdate = false;
        if (cacheStore.zIndex !== item.zIndex) {
          cacheStore.zIndex = item.zIndex;
          cacheStore.sprite.zIndex = item.zIndex;
          needUpdate = true;
        }
        if (cacheStore.stretch !== item.stretch) {
          cacheStore.stretch = item.stretch;
          cacheStore.sprite.width = item.stretch ? this.tileWidth : cacheStore.sprite.texture.width;
          cacheStore.sprite.height = item.stretch ? this.tileHeight : cacheStore.sprite.texture.height;
          needUpdate = true;
        }
        if (needUpdate) {
          this.tilesist.set(item.frameId, cacheStore);
        }
      }
    } else {
      const cache = await pixiAppService.getFrameCanvasCache(item.frameId);
      if (cache) {
        const sprite = this.createSprite(item, cache);
        if (sprite) {
          const store: ITileStore = {
            flipHorizontal: item.flipHorizontal,
            flipVertical: item.flipVertical,
            stretch: item.stretch,
            zIndex: item.zIndex,
            cache,
            sprite,
          };
          this.addChild(sprite);
          this.tilesist.set(item.frameId, store);
        }
      }
    }
  }

  clearTiles(): void {
    for (const tile of this.tilesist.values()) {
      tile.sprite?.destroy();
    }
    this.tilesist.clear();
  }

  drawBorder(visible: boolean = true, color: number = 0xc6c6c6, alpha: number = 0.4): void {
    this.rectBg
      .clear()
      .rect(1, 1, this.tileWidth - 2, this.tileHeight - 2)
      .fill({
        color: 0x000000,
        alpha: 0.001,
      })
      .stroke({ width: 1, color: color, alpha: visible ? alpha : 0.001 });
  }

  private createSprite(item: ITilesGridItem, cache: ICacheFramesCanvas | null): Sprite | null {
    if (!cache) {
      throw new Error('Не найден кеш для создания спрайта');
    }
    let canvas: HTMLCanvasElement | null;
    if (item.flipHorizontal && item.flipVertical) {
      canvas = cache.canvasFlipHV;
    } else if (item.flipHorizontal && !item.flipVertical) {
      canvas = cache.canvasFlipH;
    } else if (!item.flipHorizontal && item.flipVertical) {
      canvas = cache.canvasFlipV;
    } else {
      canvas = cache.canvas;
    }
    if (canvas) {
      const sprite = new Sprite(Texture.from(canvas));
      sprite.width = item.stretch ? this.tileWidth : sprite.texture.width;
      sprite.height = item.stretch ? this.tileHeight : sprite.texture.height;
      sprite.zIndex = item.zIndex;
      return sprite;
    }
    throw new Error('Canvas обязательна для создания спрайта');
  }
}
