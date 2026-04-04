import { computed, signal } from '@angular/core';

import { FramesSortByEnum } from '~core/constants';
import { IViewTile } from '~core/interfaces';

import { BaseTreeStore } from './base-tree.store';

export abstract class BaseTilesStore {
  protected abstract readonly treeStore: BaseTreeStore;

  protected readonly _tiles = signal<IViewTile[]>([]);

  protected readonly _sortBy = signal<FramesSortByEnum>(FramesSortByEnum.None);

  readonly sortBy = this._sortBy.asReadonly();

  readonly currentTreeId = computed(() => this.treeStore.selectedNode()?.id ?? null);

  readonly tiles = computed(() => {
    const treeId = this.treeStore.selectedNode()?.id ?? null;
    const tiles = this._tiles().filter((i: IViewTile) => i.treeId === treeId);
    switch (this.sortBy()) {
      case FramesSortByEnum.Used:
        return [...tiles].sort((a: IViewTile, b: IViewTile) => Number(b.used) - Number(a.used));
      case FramesSortByEnum.NotUsed:
        return [...tiles].sort((a: IViewTile, b: IViewTile) => Number(a.used) - Number(b.used));
      default:
        return tiles;
    }
  });

  readonly usedTiles = computed(() => {
    return this.tiles().filter((i: IViewTile) => i.used).length;
  });

  readonly noUsedTiles = computed(() => {
    return this.tiles().length - this.usedTiles();
  });

  updateUsedFrames(usedFrameIds: number[]): void {
    this._tiles.update((tiles: IViewTile[]) => {
      return tiles.map((tile: IViewTile) => {
        return {
          ...tile,
          used: usedFrameIds.includes(tile.id),
        };
      });
    });
  }

  setSelectedByIds(ids: number[]): void {
    this._tiles.update((tiles: IViewTile[]) => {
      return tiles.map((tile: IViewTile) => {
        return {
          ...tile,
          selected: ids.includes(tile.id),
        };
      });
    });
  }

  getFilteredTiles(treeId: number | null = null): IViewTile[] {
    return this._tiles().filter((i: IViewTile) => i.treeId === treeId);
  }

  canRemoveTilesByTreeIds(ids: number[]): boolean {
    return !this._tiles().some((i: IViewTile) => i.treeId && ids.includes(i.treeId) && i.used);
  }

  removeNotUsedFrames(): number[] {
    const notUsedIds = this.tiles()
      .filter((i: IViewTile) => !i.used)
      .map((i: IViewTile) => i.id);
    this.removeByIds(notUsedIds);
    return notUsedIds;
  }

  addTile(tile: IViewTile): void {
    this._tiles.update((tiles: IViewTile[]) => [...tiles, tile]);
  }

  removeByIds(ids: number[]): void {
    this._tiles.update((tiles: IViewTile[]) => {
      tiles.forEach((tile: IViewTile) => {
        if (ids.includes(tile.id)) {
          URL.revokeObjectURL(tile.objectURL);
        }
      });
      return tiles.filter((i: IViewTile) => !ids.includes(i.id));
    });
  }

  removeTile(id: number): void {
    this._tiles.update((tiles: IViewTile[]) => {
      const tile = tiles.find((i: IViewTile) => i.id === id);
      if (tile) {
        URL.revokeObjectURL(tile.objectURL);
      }
      return tiles.filter((i: IViewTile) => i.id !== id);
    });
  }

  updateTileTreeId(id: number, treeId: number | null): void {
    this._tiles.update((tiles: IViewTile[]) => {
      const idx = tiles.findIndex((i: IViewTile) => i.id === id);
      if (idx !== -1) {
        const tile = tiles[idx];
        const newTile = {
          ...tile,
          treeId: treeId,
        };
        return [...tiles.slice(0, idx), newTile, ...tiles.slice(idx + 1)];
      }
      return tiles;
    });
  }

  updateTile(item: Partial<IViewTile>): void {
    this._tiles.update((tiles: IViewTile[]) => {
      const idx = tiles.findIndex((i: IViewTile) => i.id === item.id);
      if (idx !== -1) {
        const tile = tiles[idx];
        const newTile = {
          ...tile,
          ...item,
        };
        return [...tiles.slice(0, idx), newTile, ...tiles.slice(idx + 1)];
      }
      return tiles;
    });
  }

  setTiles(tiles: IViewTile[]): void {
    this._tiles.set(tiles);
  }

  setSortBy(sortBy: FramesSortByEnum): void {
    this._sortBy.set(sortBy);
  }
}
