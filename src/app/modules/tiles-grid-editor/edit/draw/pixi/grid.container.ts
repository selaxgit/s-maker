import { Container, DestroyOptions, FederatedPointerEvent, Graphics } from 'pixi.js';
import { Subject } from 'rxjs';

import {
  EditorToolStateType,
  ICoords,
  IStoreKeyCanvas,
  ITilesGridItem,
  IViewTile,
  IWidthHeight,
} from '../../../../../common/interfaces';
import { CellContainer } from './cell.container';

const CELL_HOVER_COLOR = 0xf4c430;

export class GridContainer extends Container {
  public toolState: EditorToolStateType = 'move';

  public cellOverEvent = new Subject<ICoords | null>();

  public cellClickEvent = new Subject<ICoords>();

  public cellHasDrawEvent = new Subject<ICoords[]>();

  public cellHasRemoveEvent = new Subject<ICoords[]>();

  public isModeOverlay = false;

  private gridWidth = 0;

  private gridHeight = 0;

  private cells: Map<string, CellContainer> = new Map();

  private visibleGridValue = true;

  private isMouseDown = false;

  private drawTile: IViewTile | null = null;

  private storeCoords: ICoords[] = [];

  private rectBg = new Graphics();

  constructor() {
    super();
    this.eventMode = 'static';
    this.sortableChildren = true;
    this.rectBg.zIndex = 0;
    this.addChild(this.rectBg);
    this.on('mouseleave', () => this.stopMouseDown());
    this.on('mouseup', () => this.stopMouseDown());
  }

  public override destroy(options?: DestroyOptions): void {
    this.clearGrid();
    super.destroy(options);
  }

  public get visibleGrid(): boolean {
    return this.visibleGridValue;
  }

  public set visibleGrid(visible: boolean) {
    const canUpdate = this.visibleGridValue !== visible;
    this.visibleGridValue = visible;
    if (canUpdate) {
      this.cells.forEach((cell: CellContainer) => cell.showBorder(visible));
    }
  }

  public clearTilesByCoord(coords: ICoords): boolean {
    const key = `${coords.x}-${coords.y}`;
    if (this.cells.has(key)) {
      return (this.cells.get(key) as CellContainer).clearTiles();
    }
    return false;
  }

  public setDrawTile(tile: IViewTile | null): void {
    this.drawTile = tile;
  }

  public clearGrid(): void {
    this.cells.forEach((cell: CellContainer) => cell.destroy());
    this.cells.clear();
  }

  public drawGrid(
    mapInfo: IWidthHeight,
    tileInfo: IWidthHeight,
    tiles: ITilesGridItem[],
    storeKeyCanvas: IStoreKeyCanvas,
  ): void {
    if (this.gridWidth === mapInfo.width * tileInfo.width && this.gridHeight === mapInfo.height * tileInfo.height) {
      this.cells.forEach((cell: CellContainer) => cell.drawTiles(tiles, storeKeyCanvas));
      return;
    }
    this.gridWidth = mapInfo.width * tileInfo.width;
    this.gridHeight = mapInfo.height * tileInfo.height;
    this.rectBg.clear().rect(0, 0, this.gridWidth, this.gridHeight).fill({
      color: 0x000000,
      alpha: 0.001,
    });
    for (let x = 0; x < mapInfo.width; x++) {
      for (let y = 0; y < mapInfo.height; y++) {
        const key = `${x}-${y}`;
        let cell: CellContainer;
        if (this.cells.has(key)) {
          cell = this.cells.get(key) as CellContainer;
          cell.tileWidth = tileInfo.width;
          cell.tileHeight = tileInfo.height;
        } else {
          cell = new CellContainer(x, y, tileInfo.width, tileInfo.height);
          cell.zIndex = 2;
          this.cells.set(key, cell);
          this.addChild(cell);
          cell.on('mouseenter', () => {
            if (['remove', 'draw', 'info'].includes(this.toolState)) {
              this.cells.forEach((c: CellContainer) => c.showBorder(this.visibleGrid));
              cell.showBorder(true, CELL_HOVER_COLOR, 1);
              this.cellOverEvent.next({ x, y });
            }
          });
          cell.on('mouseleave', () => {
            this.cellOverEvent.next(null);
            cell.showBorder(this.visibleGrid);
          });
          cell.on('mousedown', () => {
            this.isMouseDown = true;
            this.storeCoords = [];
            this.actionCell(cell, x, y);
          });
          cell.on('mouseup', (e: FederatedPointerEvent) => {
            if (this.toolState === 'info') {
              this.cellClickEvent.next({ x: e.client.x, y: e.client.y });
            }
          });
          cell.on('mousemove', () => {
            if (this.isMouseDown) {
              this.actionCell(cell, x, y);
            }
          });
        }
        cell.x = x * tileInfo.width;
        cell.y = y * tileInfo.height;
        cell.showBorder(this.visibleGrid);
        cell.drawTiles(tiles, storeKeyCanvas);
      }
    }
  }

  private actionCell(cell: CellContainer, x: number, y: number): void {
    switch (this.toolState) {
      case 'draw':
        if (this.drawTile) {
          if (cell.addTile(this.drawTile, this.isModeOverlay)) {
            this.storeCoords.push({ x, y });
          }
        }
        break;
      case 'remove':
        if (cell.clearTiles()) {
          this.storeCoords.push({ x, y });
        }
        break;
    }
  }

  private stopMouseDown(): void {
    if (this.isMouseDown && this.storeCoords.length > 0) {
      switch (this.toolState) {
        case 'draw':
          this.cellHasDrawEvent.next(this.storeCoords);
          break;
        case 'remove':
          this.cellHasRemoveEvent.next(this.storeCoords);
          break;
      }
      this.storeCoords = [];
    }
    this.isMouseDown = false;
  }
}
