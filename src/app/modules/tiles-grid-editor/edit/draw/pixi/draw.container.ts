import { Container, DestroyOptions, Graphics, Sprite, Texture } from 'pixi.js';
import { Subject, takeUntil } from 'rxjs';

import { CanvasHelper } from '../../../../../common/helpers';
import {
  EditorToolStateType,
  ICoords,
  IStoreKeyCanvas,
  ITilesGridBg,
  ITilesGridItem,
  IViewTile,
  IWidthHeight,
} from '../../../../../common/interfaces';
import { GridContainer } from './grid.container';

export class DrawContainer extends Container {
  public cellOverEvent = new Subject<ICoords | null>();

  public cellClickEvent = new Subject<ICoords>();

  public cellHasDrawEvent = new Subject<ICoords[]>();

  public cellHasRemoveEvent = new Subject<ICoords[]>();

  private readonly gridContainer = new GridContainer();

  private readonly rectBg = new Graphics();

  private bgSprite: Sprite | null = null;

  private drawingSprite: Sprite | null = null;

  private bgFileInfo: { name: string; size: number } | null = null;

  private hUnsubscribe = new Subject<void>();

  private tileWidth = 0;

  private tileHeight = 0;

  private toolStateValue: EditorToolStateType = 'move';

  constructor() {
    super();
    this.sortableChildren = true;
    this.rectBg.zIndex = 0;
    this.gridContainer.zIndex = 2;
    this.addChild(this.rectBg);
    this.addChild(this.gridContainer);
    this.gridContainer.cellOverEvent.pipe(takeUntil(this.hUnsubscribe)).subscribe((coords: ICoords | null) => {
      this.cellOverEvent.next(coords);
      this.setDrawingSpriteCoords(coords);
    });
    this.gridContainer.cellClickEvent.pipe(takeUntil(this.hUnsubscribe)).subscribe((coords: ICoords) => {
      this.cellClickEvent.next(coords);
    });
    this.gridContainer.cellHasDrawEvent.pipe(takeUntil(this.hUnsubscribe)).subscribe((coords: ICoords[]) => {
      this.cellHasDrawEvent.next(coords);
    });
    this.gridContainer.cellHasRemoveEvent.pipe(takeUntil(this.hUnsubscribe)).subscribe((coords: ICoords[]) => {
      this.cellHasRemoveEvent.next(coords);
    });
  }

  public override destroy(options?: DestroyOptions): void {
    this.hUnsubscribe.next();
    this.hUnsubscribe.complete();
    super.destroy(options);
  }

  public set toolState(value: EditorToolStateType) {
    this.gridContainer.toolState = value;
    this.toolStateValue = value;
    if (this.drawingSprite) {
      this.drawingSprite.visible = value === 'draw';
    }
  }

  public clearTilesByCoord(coords: ICoords): boolean {
    return this.gridContainer.clearTilesByCoord(coords);
  }

  public setModeOverlay(value: boolean): void {
    this.gridContainer.isModeOverlay = value;
  }

  public setDrawTile(tile: IViewTile | null): void {
    this.gridContainer.setDrawTile(tile);
    if (this.drawingSprite) {
      this.drawingSprite.destroy();
      this.drawingSprite = null;
    }
    if (!tile || !tile.canvas) {
      return;
    }
    this.drawingSprite = new Sprite(Texture.from(tile.canvas));
    this.drawingSprite.zIndex = 10;
    this.drawingSprite.visible = false;
    this.addChild(this.drawingSprite);
  }

  public async drawBackground(gridBg: ITilesGridBg | null): Promise<void> {
    if (!gridBg || !gridBg.file) {
      this.clearBgSprite();
      return;
    }
    if (!this.compareBg(gridBg.file)) {
      this.bgFileInfo = {
        name: gridBg.file.name,
        size: gridBg.file.size,
      };
      this.clearBgSprite();
      const fileCanvas = await CanvasHelper.fileToCanvas(gridBg.file);
      this.bgSprite = new Sprite(Texture.from(fileCanvas));
      this.bgSprite.zIndex = 1;
      this.bgSprite.alpha = gridBg.opacity;
      this.addChild(this.bgSprite);
    } else if (this.bgSprite) {
      this.bgSprite.alpha = gridBg.opacity;
    }
  }

  public setVisibleBackground(visible: boolean): void {
    if (this.bgSprite) {
      this.bgSprite.visible = visible;
    }
  }

  public setVisibleGrid(visible: boolean): void {
    this.gridContainer.visibleGrid = visible;
  }

  public drawGrid(
    mapInfo: IWidthHeight | null,
    tileInfo: IWidthHeight | null,
    tiles: ITilesGridItem[],
    storeKeyCanvas: IStoreKeyCanvas,
  ): void {
    this.rectBg.clear();
    if (mapInfo && tileInfo) {
      this.tileWidth = tileInfo.width;
      this.tileHeight = tileInfo.height;
      const width = mapInfo.width * tileInfo.width;
      const height = mapInfo.height * tileInfo.height;
      this.rectBg.clear().rect(0, 0, width, height).fill({
        color: 0x000000,
        alpha: 0.001,
      });
      this.gridContainer.drawGrid(mapInfo, tileInfo, tiles, storeKeyCanvas);
    } else {
      this.gridContainer.clearGrid();
    }
  }

  private clearBgSprite(): void {
    if (this.bgSprite) {
      this.bgSprite.destroy();
      this.bgSprite = null;
    }
  }

  private compareBg(file: File): boolean {
    return Boolean(this.bgFileInfo && this.bgFileInfo.name === file.name && this.bgFileInfo.size === file.size);
  }

  private setDrawingSpriteCoords(coords: ICoords | null): void {
    if (!this.drawingSprite) {
      return;
    }
    if (coords) {
      this.drawingSprite.x = coords.x * this.tileWidth;
      this.drawingSprite.y = coords.y * this.tileHeight;
      this.drawingSprite.visible = this.toolStateValue === 'draw';
    } else {
      this.drawingSprite.visible = false;
    }
  }
}
