import { computed, Injectable, signal } from '@angular/core';
import { ISUCoords } from '@selax/utils';
import { Subject } from 'rxjs';

import { PropertiesType, ReplaceTilePropertiesEnum } from '~constants/common.constants';
import { areGridParamsEqual } from '~core/helpers';
import { ITilesGrid, ITilesGridItem, ITilesGridParams } from '~core/interfaces';
import { ZoomEnum } from '~pixijs/interfaces';

@Injectable({
  providedIn: 'root',
})
export class EditGridStore {
  private readonly _grid = signal<ITilesGrid | null>(null);

  private readonly _gridParams = signal<ITilesGridParams | null>(null);

  private readonly _gridItems = signal<ITilesGridItem[]>([]);

  private readonly _drawOverlay = signal<boolean>(false);

  private readonly _visibleGrid = signal<boolean>(true);

  private readonly _visibleBackground = signal<boolean>(true);

  private readonly _currentCell = signal<ISUCoords | null>(null);

  private readonly _contextMenuOpened = signal<boolean>(false);

  private readonly _hasChanged = signal<boolean>(false);

  private readonly zoomState = new Subject<ZoomEnum>();

  private readonly _drawFrameId = signal<number | null>(null);

  private readonly showGridItemPropeties = new Subject<ITilesGridItem>();

  readonly grid = this._grid.asReadonly();

  readonly gridParams = this._gridParams.asReadonly();

  readonly gridItems = this._gridItems.asReadonly();

  readonly drawOverlay = this._drawOverlay.asReadonly();

  readonly visibleGrid = this._visibleGrid.asReadonly();

  readonly visibleBackground = this._visibleBackground.asReadonly();

  readonly currentCell = this._currentCell.asReadonly();

  readonly contextMenuOpened = this._contextMenuOpened.asReadonly();

  readonly hasChanged = this._hasChanged.asReadonly();

  readonly zoomState$ = this.zoomState.asObservable();

  readonly drawFrameId = this._drawFrameId.asReadonly();

  readonly showGridItemPropeties$ = this.showGridItemPropeties.asObservable();

  readonly gridName = computed(() => this._grid()?.name ?? null);

  readonly currentCellHint = computed(() => {
    const cell = this._currentCell();
    return cell ? `${cell.x}x${cell.y}` : 'нет';
  });

  readonly isNewGrid = computed(() => this._grid()?.id === -1);

  showGridItemPropetiesEvent(tile: ITilesGridItem): void {
    this.showGridItemPropeties.next(tile);
  }

  setDrawFrameId(frameId: number | null): void {
    this._drawFrameId.set(frameId);
  }

  zoomEvent(zoom: ZoomEnum): void {
    this.zoomState.next(zoom);
  }

  setContextMenuOpened(contextMenuOpened: boolean): void {
    this._contextMenuOpened.set(contextMenuOpened);
  }

  setDrawOverlay(drawOverlay: boolean): void {
    this._drawOverlay.set(drawOverlay);
  }

  setVisibleGrid(visibleGrid: boolean): void {
    this._visibleGrid.set(visibleGrid);
  }

  setVisibleBackground(visibleBackground: boolean): void {
    this._visibleBackground.set(visibleBackground);
  }

  setCurrentCell(coords: ISUCoords | null): void {
    this._currentCell.set(coords);
  }

  topZIndexGridItemByCoords(coords: ISUCoords, frameId: number): void {
    const items = this._gridItems();
    const cellItems = items.filter((i: ITilesGridItem) => i.x === coords.x && i.y === coords.y);
    cellItems.forEach((item: ITilesGridItem, idx: number) => {
      item.zIndex = item.frameId === frameId ? cellItems.length : idx;
    });
    this.updateGrid({ items: [...items] });
  }

  updateGridAllItemProperties(replaceType: ReplaceTilePropertiesEnum, properties: PropertiesType): void {
    const items = this._gridItems();
    for (const item of items) {
      if (replaceType === ReplaceTilePropertiesEnum.REPLACE) {
        item.properties = properties;
      } else if (replaceType === ReplaceTilePropertiesEnum.MERGE) {
        item.properties = { ...item.properties, ...properties };
      }
    }
    this.updateGrid({ items: [...items] });
  }

  updateGridItemByCoords(coords: ISUCoords, frameId: number, params: Partial<ITilesGridItem>): void {
    const items = this._gridItems();
    const idx = items.findIndex((i: ITilesGridItem) => i.x === coords.x && i.y === coords.y && i.frameId === frameId);
    if (idx === -1) {
      return;
    }
    const item = { ...items[idx], ...params };
    items[idx] = item;
    this.updateGrid({ items: [...items] });
  }

  removeGridItemByCoords(coords: ISUCoords, frameId: number | null = null): void {
    if (frameId === null) {
      const items = this._gridItems().filter((i: ITilesGridItem) => !(i.x === coords.x && i.y === coords.y));
      this.updateGrid({ items });
    } else if (frameId === -1) {
      // Удалить самый верхний объект в ячейке
      const items = this._gridItems().filter((i: ITilesGridItem) => i.x === coords.x && i.y === coords.y);
      const frameId = items.pop()?.frameId ?? null;
      this.removeGridItemByCoords(coords, frameId);
    } else {
      const items = this._gridItems().filter(
        (i: ITilesGridItem) => !(i.x === coords.x && i.y === coords.y && i.frameId === frameId),
      );
      this.updateGrid({ items });
    }
  }

  getGridItemsbyCoords(coords: ISUCoords | null): ITilesGridItem[] {
    if (!coords) {
      return [];
    }
    const cellItems = [...this._gridItems().filter((i: ITilesGridItem) => i.x === coords.x && i.y === coords.y)];
    return cellItems.sort((a: ITilesGridItem, b: ITilesGridItem) => b.zIndex - a.zIndex);
  }

  addGridItem(frameId: number, coords: ISUCoords): void {
    const newItem: ITilesGridItem = {
      x: coords.x,
      y: coords.y,
      frameId,
      flipHorizontal: false,
      flipVertical: false,
      stretch: false,
      properties: {},
      zIndex: 0,
    };
    let items = [...this._gridItems()];
    if (this._drawOverlay()) {
      const cellItems = items.filter((i: ITilesGridItem) => i.x === coords.x && i.y === coords.y);
      if (!cellItems.some((i: ITilesGridItem) => i.frameId === frameId)) {
        newItem.zIndex = cellItems.length;
        items.push(newItem);
      }
    } else {
      items = items.filter((i: ITilesGridItem) => !(i.x === coords.x && i.y === coords.y));
      items.push(newItem);
    }
    this.updateGrid({ items });
  }

  updateGridName(name: string): void {
    if (this.gridName() !== name) {
      this.updateGrid({ name });
    }
  }

  updateGridParams(params: ITilesGridParams): void {
    if (!areGridParamsEqual(params, this._gridParams())) {
      this.updateGrid({
        mapInfo: {
          width: params.mapWidth,
          height: params.mapHeight,
        },
        tileInfo: {
          width: params.tileWidth,
          height: params.tileHeight,
        },
        background: {
          opacity: params.bgOpacity,
          file: params.bgFile,
        },
      });
    }
  }

  updateGrid(params: Partial<ITilesGrid>): void {
    const grid = this._grid();
    if (grid) {
      this._grid.set({ ...grid, ...params });
      if (Object.keys(params).some((key: string) => ['mapInfo', 'tileInfo', 'background'].includes(key))) {
        this.setGridParams();
      }
      if (params.items !== undefined) {
        this._gridItems.set(params.items);
      }
      this._hasChanged.set(true);
    }
  }

  setGrid(grid: ITilesGrid): void {
    this._grid.set(grid);
    this._gridItems.set(grid.items);
    this.setGridParams();
    this._hasChanged.set(false);
  }

  setHasChanged(hasChanged: boolean): void {
    this._hasChanged.set(hasChanged);
  }

  reset(): void {
    this._grid.set(null);
    this._hasChanged.set(false);
  }

  private setGridParams(): void {
    const grid = this._grid();
    this._gridParams.set(
      grid
        ? {
            mapWidth: grid.mapInfo.width,
            mapHeight: grid.mapInfo.height,
            tileWidth: grid.tileInfo.width,
            tileHeight: grid.tileInfo.height,
            bgOpacity: grid.background.opacity,
            bgFile: grid.background.file,
          }
        : null,
    );
  }
}
