import { ISUCoords, SUCanvasHelper } from '@selax/utils';
import { Container, DestroyOptions, FederatedPointerEvent, Graphics, Sprite, Texture } from 'pixi.js';

import { ITilesGridItem, ITilesGridParams } from '~core/interfaces';
import { PixiAppService } from '~core/services';
import { AppPixiStateEnum } from '~pixijs/interfaces';

import { CellContainer } from './cell.container';

const CELL_HOVER_COLOR = 0xf4c430;

export class GridContainer extends Container {
  onCellCoordsHover?: (coords: ISUCoords | null) => void;

  onCellEnter?: (coords: ISUCoords | null) => void;

  onCellDown?: (coords: ISUCoords) => void;

  onCellUp?: (mouseCoords: ISUCoords, cellCoords: ISUCoords) => void;

  private readonly rectBg = new Graphics();

  private backgroundSprite: Sprite | null = null;

  private drawTile: Sprite | null = null;

  private currentFileName: string | null = null;

  private currentFileSize: number | null = null;

  private readonly cellsList = new Map<string, CellContainer>();

  private _visibleGrid = true;

  private _visibleBackground = true;

  private _drawTileId: number | null = null;

  private _state: AppPixiStateEnum = AppPixiStateEnum.Move;

  private isMouseDown = false;

  private _isContextMenuOpened = false;

  private _isHoldEvent = false;

  private _currentCellCoords: ISUCoords | null = null;

  constructor(private readonly pixiAppService: PixiAppService) {
    super();
    this.eventMode = 'static';
    this.sortableChildren = true;
    this.rectBg.zIndex = 1;
    this.addChild(this.rectBg);
    this.on('mousedown', () => (this.isMouseDown = true));
    this.on('mouseleave', () => {
      this.isMouseDown = false;
      if (this.drawTile && this.drawTile.visible) {
        this.drawTile.visible = false;
      }
    });
    this.on('mouseup', () => (this.isMouseDown = false));
  }

  override destroy(options?: DestroyOptions): void {
    this.rectBg.destroy();
    this.clearDrawTile();
    this.clearBackground();
    this.clearCellsList();
    super.destroy(options);
  }

  get isHoldEvent(): boolean {
    return this._isHoldEvent;
  }

  set isHoldEvent(value: boolean) {
    this._isHoldEvent = value;
  }

  get drawTileId(): number | null {
    return this._drawTileId;
  }

  get currentCellCoords(): ISUCoords | null {
    return this._currentCellCoords;
  }

  get isContextMenuOpened(): boolean {
    return this._isContextMenuOpened;
  }

  set isContextMenuOpened(opened: boolean) {
    this._isContextMenuOpened = opened;
    if (!opened) {
      this.cellsList.forEach((cell: CellContainer) => cell.drawBorder(this.visibleGrid));
    } else if (this.drawTile) {
      this.drawTile.visible = false;
    }
  }

  get visibleBackground(): boolean {
    return this._visibleBackground;
  }

  set visibleBackground(visible: boolean) {
    this._visibleBackground = visible;
    if (this.backgroundSprite) {
      this.backgroundSprite.visible = visible;
    }
  }

  get visibleGrid(): boolean {
    return this._visibleGrid;
  }

  set visibleGrid(visible: boolean) {
    this._visibleGrid = visible;
    this.cellsList.forEach((cell: CellContainer) => cell.drawBorder(this._visibleGrid));
  }

  get state(): AppPixiStateEnum {
    return this._state;
  }

  set state(value: AppPixiStateEnum) {
    this._state = value;
    if (this.drawTile) {
      this.drawTile.visible = value === AppPixiStateEnum.DrawObject;
    }
  }

  async setDrawTile(id: number | null): Promise<void> {
    if (id === null) {
      this.clearDrawTile();
    } else if (this._drawTileId !== id) {
      const x = this.drawTile?.x ?? null;
      const y = this.drawTile?.y ?? null;
      this.clearDrawTile();
      this._drawTileId = id;
      const canvasCache = await this.pixiAppService.getFrameCanvasCache(id);
      if (canvasCache) {
        this.drawTile = new Sprite(Texture.from(canvasCache.canvas));
        this.drawTile.eventMode = 'none';
        this.drawTile.zIndex = 300;
        if (x !== null && y !== null) {
          this.drawTile.x = x;
          this.drawTile.y = y;
          this.drawTile.visible = this._state === AppPixiStateEnum.DrawObject;
        } else {
          this.drawTile.visible = false;
        }
        this.addChild(this.drawTile);
      }
    }
  }

  async drawItems(items: ITilesGridItem[]): Promise<void> {
    if (this.cellsList.size === 0) {
      return;
    }
    const drawItems: Record<string, ITilesGridItem[]> = {};
    for (const item of items) {
      const key = `${item.x}-${item.y}`;
      if (!drawItems[key]) {
        drawItems[key] = [];
      }
      drawItems[key].push(item);
    }
    for (const key in drawItems) {
      const cell = this.cellsList.get(key);
      if (cell) {
        await cell.drawTiles(drawItems[key], this.pixiAppService);
      }
    }
    const keys = Object.keys(drawItems);
    this.cellsList.forEach((cell: CellContainer, key: string) => {
      if (!keys.includes(key)) {
        cell.clearTiles();
      }
    });
  }

  async drawGrid(params: ITilesGridParams | null): Promise<void> {
    if (!params) {
      this.rectBg.clear();
      this.clearBackground();
      this.clearCellsList();
      return;
    }
    this.rectBg
      .clear()
      .rect(0, 0, params.mapWidth * params.tileWidth, params.mapHeight * params.tileHeight)
      .fill({
        color: 0x000000,
        alpha: 0.001,
      });
    this.clearCellsList();
    await this.drawBackground(params.bgFile, params.bgOpacity);
    for (let x = 0; x < params.mapWidth; x++) {
      for (let y = 0; y < params.mapHeight; y++) {
        const cell = new CellContainer({ x, y }, params.tileWidth, params.tileHeight);
        const key = `${x}-${y}`;
        this.cellsList.set(key, cell);
        cell.zIndex = 5;
        cell.x = x * params.tileWidth;
        cell.y = y * params.tileHeight;
        cell.drawBorder(this._visibleGrid);
        this.addChild(cell);
        cell
          .on('mouseenter', this.cellMouseEnter)
          .on('mouseleave', this.cellMouseLeave)
          .on('mousedown', this.cellMouseDown)
          .on('mouseup', this.cellMouseUp);
      }
    }
  }

  async drawBackground(file: File | null, opacity: number): Promise<void> {
    if (!file) {
      this.clearBackground();
    } else if (this.compareBackgroundFile(file)) {
      if (this.backgroundSprite) {
        this.backgroundSprite.alpha = opacity;
      }
    } else {
      if (this.backgroundSprite) {
        this.clearBackground();
      }
      this.currentFileName = file.name;
      this.currentFileSize = file.size;
      const fileCanvas = await SUCanvasHelper.fileToCanvas(file);
      this.backgroundSprite = new Sprite(Texture.from(fileCanvas));
      this.backgroundSprite.zIndex = 0;
      this.backgroundSprite.alpha = opacity;
      this.addChild(this.backgroundSprite);
    }
  }

  private compareBackgroundFile(file: File): boolean {
    return this.currentFileName === file.name && this.currentFileSize === file.size;
  }

  private clearBackground(): void {
    if (this.backgroundSprite) {
      this.backgroundSprite.destroy();
      this.backgroundSprite = null;
    }
  }

  private clearCellsList(): void {
    this.cellsList.forEach((cell: CellContainer) => cell.destroy());
    this.cellsList.clear();
  }

  private clearDrawTile(): void {
    this._drawTileId = null;
    if (this.drawTile) {
      this.drawTile.destroy();
      this.drawTile = null;
    }
  }

  private cellMouseDown = (event: FederatedPointerEvent): void => {
    if (!this._isHoldEvent && event.currentTarget instanceof CellContainer && !this._isContextMenuOpened) {
      const cell = event.currentTarget as CellContainer;
      this.onCellDown?.(cell.coords);
    }
  };

  private cellMouseUp = (event: FederatedPointerEvent): void => {
    if (!this._isHoldEvent && event.currentTarget instanceof CellContainer && !this._isContextMenuOpened) {
      const cell = event.currentTarget as CellContainer;
      this.onCellUp?.({ x: event.clientX, y: event.clientY }, cell.coords);
    }
  };

  private cellMouseLeave = (event: FederatedPointerEvent): void => {
    this._currentCellCoords = null;
    this.onCellCoordsHover?.(null);
    if (!this._isHoldEvent && event.currentTarget instanceof CellContainer && !this._isContextMenuOpened) {
      const cell = event.currentTarget as CellContainer;
      cell.drawBorder(this.visibleGrid);
    }
  };

  private cellMouseEnter = (event: FederatedPointerEvent): void => {
    if (this._isHoldEvent || !(event.currentTarget instanceof CellContainer)) {
      return;
    }
    const cell = event.currentTarget as CellContainer;
    this._currentCellCoords = cell.coords;
    this.onCellCoordsHover?.(cell.coords);
    if (!this._isContextMenuOpened) {
      if (this.drawTile) {
        this.drawTile.x = cell.x;
        this.drawTile.y = cell.y;
        this.drawTile.visible = this._state === AppPixiStateEnum.DrawObject;
      }

      this.cellsList.forEach((c: CellContainer) => c.drawBorder(this.visibleGrid));
      if ([AppPixiStateEnum.RemoveObject, AppPixiStateEnum.Info].includes(this.state)) {
        if (this.state !== AppPixiStateEnum.DrawObject) {
          cell.drawBorder(true, CELL_HOVER_COLOR, 1);
        }
      }
      if (this.isMouseDown) {
        this.onCellEnter?.(cell.coords);
      }
    }
  };
}
