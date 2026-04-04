import { ISUCoords } from '@selax/utils';
import { DestroyOptions, RendererDestroyOptions } from 'pixi.js';

import { ITilesGridItem, ITilesGridParams } from '~core/interfaces';
import { PixiAppService } from '~core/services';
import { AppPixiStateEnum } from '~pixijs/interfaces';
import { PixiApp } from '~pixijs/pixi.app';

import { GridContainer } from './grid.container';

export class GridApp extends PixiApp {
  onCellCoordsHover?: (coords: ISUCoords | null) => void;

  onCellEnter?: (coords: ISUCoords | null) => void;

  onCellDown?: (coords: ISUCoords) => void;

  onCellUp?: (mouseCoords: ISUCoords, cellCoords: ISUCoords) => void;

  private gridContainer: GridContainer;

  constructor(private readonly pixiAppService: PixiAppService) {
    super();
    this.gridContainer = new GridContainer(this.pixiAppService);
  }

  override destroy(rendererDestroyOptions: RendererDestroyOptions = false, options: DestroyOptions = false): void {
    this.gridContainer.destroy();
    super.destroy(rendererDestroyOptions, options);
  }

  override async initialize(element: HTMLElement): Promise<void> {
    await super.initialize(element);
    this.viewport.addChild(this.gridContainer);
    this.gridContainer.onCellCoordsHover = (coords: ISUCoords | null): void => this.onCellCoordsHover?.(coords);
    this.gridContainer.onCellEnter = (coords: ISUCoords | null): void => this.onCellEnter?.(coords);
    this.gridContainer.onCellDown = (coords: ISUCoords): void => this.onCellDown?.(coords);
    this.gridContainer.onCellUp = (mouseCoords: ISUCoords, cellCoords: ISUCoords): void =>
      this.onCellUp?.(mouseCoords, cellCoords);
  }

  override set state(value: AppPixiStateEnum) {
    super.state = value;
    this.gridContainer.state = value;
  }

  override get state(): AppPixiStateEnum {
    return super.state;
  }

  get isContextMenuOpened(): boolean {
    return this.gridContainer.isContextMenuOpened;
  }

  set isContextMenuOpened(opened: boolean) {
    this.gridContainer.isContextMenuOpened = opened;
  }

  get isHoldEvent(): boolean {
    return this.gridContainer.isHoldEvent;
  }

  set isHoldEvent(value: boolean) {
    this.gridContainer.isHoldEvent = value;
  }

  get visibleBackground(): boolean {
    return this.gridContainer.visibleBackground;
  }

  set visibleBackground(visible: boolean) {
    this.gridContainer.visibleBackground = visible;
  }

  get visibleGrid(): boolean {
    return this.gridContainer.visibleGrid;
  }

  set visibleGrid(visible: boolean) {
    this.gridContainer.visibleGrid = visible;
  }

  get drawTileId(): number | null {
    return this.gridContainer.drawTileId;
  }

  get currentCellCoords(): ISUCoords | null {
    return this.gridContainer.currentCellCoords;
  }

  drawGrid(params: ITilesGridParams | null): Promise<void> {
    return this.gridContainer.drawGrid(params);
  }

  setDrawTile(id: number | null): Promise<void> {
    return this.gridContainer.setDrawTile(id);
  }

  drawItems(items: ITilesGridItem[]): Promise<void> {
    return this.gridContainer.drawItems(items);
  }
}
