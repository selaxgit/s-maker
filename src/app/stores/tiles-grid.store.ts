import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { finalize, forkJoin, Observable, of, Subject, switchMap, tap } from 'rxjs';

import { CanvasHelper } from '../common/helpers';
import {
  EditorToolStateType,
  ICoords,
  IDBTreeItem,
  IFlatTreeFrames,
  IProperties,
  ITilesGrid,
  ITilesGridBg,
  ITilesGridItem,
  ITreeItem,
  IViewTile,
  ReplaceTilePropertiesType,
  ZoomType,
} from '../common/interfaces';
import { FramesService } from '../common/services/frames';
import { TilesGridService } from '../common/services/tiles';

type ContextMenuOperationType =
  | 'clear-cell'
  | 'switch-flip-vertical'
  | 'switch-flip-horizontal'
  | 'switch-stretch'
  | 'property-frame'
  | 'top-z-index'
  | 'remove-frame';

interface IContextMenuData {
  coords: ICoords;
  tiles: ITilesGridItem[];
}

interface IContextMenuValue {
  coords: ICoords;
  tile?: ITilesGridItem;
}

interface GridsState {
  gridsList: ITilesGrid[];
  currentTileGrid: ITilesGrid | null;
  currentTileGridBg: ITilesGridBg | null;
  isCurrentTileGridInitializing: boolean;
  editorToolState: EditorToolStateType;
  editorDrawOverlay: boolean;
  editorVisibleGrid: boolean;
  editorVisibleBg: boolean;
  editorVisibleSidebar: boolean;
  editorCurrentCoords: ICoords | null;
  editorStatusHint: string | null;
  editorFlatTreeFrames: IFlatTreeFrames[];
  initializingFrameTree: boolean;
  editorDrawTile: IViewTile | null;
  editorContextMenu: ICoords | null;
  editorContextMenuData: IContextMenuData | null;
  editorContextMenuVisible: boolean;
  editorShowTileInfo: ITilesGridItem | null;
}

const initialState: GridsState = {
  gridsList: [],
  currentTileGrid: null,
  currentTileGridBg: null,
  isCurrentTileGridInitializing: false,
  editorToolState: 'move',
  editorDrawOverlay: false,
  editorVisibleGrid: true,
  editorVisibleBg: true,
  editorVisibleSidebar: false,
  editorCurrentCoords: null,
  editorStatusHint: null,
  editorFlatTreeFrames: [],
  initializingFrameTree: true,
  editorDrawTile: null,
  editorContextMenu: null,
  editorContextMenuData: null,
  editorContextMenuVisible: false,
  editorShowTileInfo: null,
};

@Injectable({ providedIn: 'root' })
export class TilesGridStore extends ComponentStore<GridsState> {
  readonly gridsList$ = this.select((state: GridsState) => state.gridsList);

  readonly currentTileGrid$ = this.select((state: GridsState) => state.currentTileGrid);

  readonly currentTileGridBg$ = this.select((state: GridsState) => state.currentTileGridBg);

  readonly isCurrentTileGridInitializing$ = this.select((state: GridsState) => state.isCurrentTileGridInitializing);

  readonly editorToolState$ = this.select((state: GridsState) => state.editorToolState);

  readonly editorDrawOverlay$ = this.select((state: GridsState) => state.editorDrawOverlay);

  readonly editorVisibleGrid$ = this.select((state: GridsState) => state.editorVisibleGrid);

  readonly editorVisibleBg$ = this.select((state: GridsState) => state.editorVisibleBg);

  readonly editorVisibleSidebar$ = this.select((state: GridsState) => state.editorVisibleSidebar);

  readonly editorCurrentCoords$ = this.select((state: GridsState) => state.editorCurrentCoords);

  readonly editorStatusHint$ = this.select((state: GridsState) => state.editorStatusHint);

  readonly editorFlatTreeFrames$ = this.select((state: GridsState) => state.editorFlatTreeFrames);

  readonly initializingFrameTree$ = this.select((state: GridsState) => state.initializingFrameTree);

  readonly editorDrawTile$ = this.select((state: GridsState) => state.editorDrawTile);

  readonly editorContextMenu$ = this.select((state: GridsState) => state.editorContextMenu);

  readonly editorContextMenuData$ = this.select((state: GridsState) => state.editorContextMenuData);

  readonly editorContextMenuVisible$ = this.select((state: GridsState) => state.editorContextMenuVisible);

  readonly editorShowTileInfo$ = this.select((state: GridsState) => state.editorShowTileInfo);

  private editorZoomEvent = new Subject<ZoomType>();

  readonly editorZoomEvent$ = this.editorZoomEvent.asObservable();

  constructor(
    private readonly tilesGridService: TilesGridService,
    private readonly framesService: FramesService,
  ) {
    super(initialState);
  }

  public updateTilesPropertiesInGrid(replaceType: ReplaceTilePropertiesType, props: IProperties): void {
    const tileGrid = this.get().currentTileGrid;
    if (!tileGrid) {
      return;
    }
    tileGrid.items.forEach((tile: ITilesGridItem) => {
      if (replaceType === 'add') {
        tile.properties = { ...tile.properties, ...props };
      } else if (replaceType === 'replace') {
        tile.properties = props;
      }
    });
    this.tilesGridService.updateTileGrid(tileGrid.id, { items: tileGrid.items }).subscribe((grid: ITilesGrid) => {
      this.patchState({ currentTileGrid: grid });
    });
  }

  public updateTileInGrid(coords: ICoords, referenceId: number, props: IProperties): void {
    const tileGrid = this.get().currentTileGrid;
    if (!tileGrid) {
      return;
    }
    tileGrid.items.forEach((tile: ITilesGridItem) => {
      if (tile.x === coords.x && tile.y === coords.y && referenceId === tile.referenceId) {
        tile.properties = props;
      }
    });
    this.tilesGridService.updateTileGrid(tileGrid.id, { items: tileGrid.items }).subscribe((grid: ITilesGrid) => {
      this.patchState({ currentTileGrid: grid });
    });
  }

  public onActionContextMenu(operation: ContextMenuOperationType, value: IContextMenuValue): void {
    const tileGrid = this.get().currentTileGrid;
    if (!tileGrid) {
      return;
    }
    switch (operation) {
      case 'clear-cell':
        tileGrid.items = tileGrid.items.filter(
          (i: ITilesGridItem) => !(i.x === value.coords.x && i.y === value.coords.y),
        );
        break;
      case 'switch-flip-vertical':
        tileGrid.items.forEach((tile: ITilesGridItem) => {
          if (tile.x === value.coords.x && tile.y === value.coords.y && value.tile?.referenceId === tile.referenceId) {
            tile.flipVertical = !tile.flipVertical;
          }
        });
        break;
      case 'switch-flip-horizontal':
        tileGrid.items.forEach((tile: ITilesGridItem) => {
          if (tile.x === value.coords.x && tile.y === value.coords.y && value.tile?.referenceId === tile.referenceId) {
            tile.flipHorizontal = !tile.flipHorizontal;
          }
        });
        break;
      case 'switch-stretch':
        tileGrid.items.forEach((tile: ITilesGridItem) => {
          if (tile.x === value.coords.x && tile.y === value.coords.y && value.tile?.referenceId === tile.referenceId) {
            tile.stretch = !tile.stretch;
          }
        });
        break;
      case 'property-frame':
        if (value.tile) {
          this.patchState({ editorShowTileInfo: value.tile });
        }
        break;
      case 'top-z-index':
        tileGrid.items.forEach((tile: ITilesGridItem) => {
          if (tile.x === value.coords.x && tile.y === value.coords.y) {
            tile.zIndex = value.tile?.referenceId === tile.referenceId ? 1 : 0;
          }
        });
        break;
      case 'remove-frame':
        tileGrid.items = tileGrid.items.filter(
          (i: ITilesGridItem) =>
            !(i.x === value.coords.x && i.y === value.coords.y && value.tile?.referenceId === i.referenceId),
        );
        break;
    }
    this.tilesGridService.updateTileGrid(tileGrid.id, { items: tileGrid.items }).subscribe((grid: ITilesGrid) => {
      this.patchState({ currentTileGrid: grid });
    });
  }

  public showContextMenu(coords: ICoords): void {
    this.patchState({ editorContextMenu: coords });
  }

  public onContextMenuState(isOpened: boolean): void {
    this.patchState({ editorContextMenu: null, editorContextMenuVisible: isOpened });
    const tileGrid = this.get().currentTileGrid;
    if (isOpened && tileGrid) {
      const coords = this.get().editorCurrentCoords;
      let tiles: ITilesGridItem[] = [];
      if (coords) {
        tiles = tileGrid.items.filter((i: ITilesGridItem) => i.x === coords.x && i.y === coords.y);
        tiles.sort((a: ITilesGridItem, b: ITilesGridItem) => b.zIndex - a.zIndex);
        this.patchState({ editorContextMenuData: { coords, tiles } });
      } else {
        this.patchState({ editorContextMenuData: null });
      }
    }
  }

  public canUseContextMenu(): boolean {
    return ['draw', 'info', 'remove'].includes(this.get().editorToolState);
  }

  public setEditorRemoveByCoors(coords: ICoords[]): void {
    const tileGrid = this.get().currentTileGrid;
    if (!tileGrid) {
      return;
    }
    const keys: string[] = [];
    for (const c of coords) {
      keys.push(`${c.x}x${c.y}`);
    }
    tileGrid.items = tileGrid.items.filter((i: ITilesGridItem) => !keys.includes(`${i.x}x${i.y}`));
    this.tilesGridService.updateTileGrid(tileGrid.id, { items: tileGrid.items }).subscribe(() => {
      this.patchState({ currentTileGrid: tileGrid });
    });
  }

  public setEditorDrawByCoors(coords: ICoords[]): void {
    const drawTile = this.get().editorDrawTile;
    const tileGrid = this.get().currentTileGrid;
    if (!drawTile || !tileGrid) {
      return;
    }
    for (const c of coords) {
      tileGrid.items.push({
        x: c.x,
        y: c.y,
        referenceId: drawTile.id,
        flipHorizontal: false,
        flipVertical: false,
        stretch: false,
        properties: {},
        zIndex: 0,
      });
    }

    tileGrid.items = [...new Set(tileGrid.items.map((i: ITilesGridItem) => JSON.stringify(i)))].map((i: string) =>
      JSON.parse(i),
    );
    this.tilesGridService.updateTileGrid(tileGrid.id, { items: tileGrid.items }).subscribe(() => {
      this.patchState({ currentTileGrid: tileGrid });
    });
  }

  public setEditorDrawTile(tile: IViewTile): void {
    this.patchState({ editorDrawTile: tile, editorVisibleSidebar: false });
    this.selectTile(tile.id);
  }

  public expandEditorFlatTreeFrames(collapse: boolean): void {
    const tree = this.get().editorFlatTreeFrames.map((i: IFlatTreeFrames) => ({
      ...i,
      collapse,
    }));
    this.patchState({ editorFlatTreeFrames: tree });
  }

  public initializeFramesFlatTree(projectId: number): void {
    this.patchState({
      editorStatusHint: 'Инициализация фреймов.... Подождите, пожалуйста',
      initializingFrameTree: true,
    });
    forkJoin([
      this.framesService.getFramesTree((i: IDBTreeItem) => i.projectId === projectId),
      this.framesService.fetchTilesByProject(projectId),
    ])
      .pipe(finalize(() => this.patchState({ editorStatusHint: null, initializingFrameTree: false })))
      .subscribe(async ([tree, frames]: [ITreeItem[], IViewTile[]]) => {
        const flatTree = await this.buildTreeFrames(tree, frames);
        this.patchState({ editorFlatTreeFrames: flatTree });
        return of(undefined);
      });
  }

  public setEditorCurrentCoords(coords: ICoords | null): void {
    this.patchState({ editorCurrentCoords: coords });
  }

  public setEditorVisibleSidebar(value: boolean): void {
    const tile = this.get().editorDrawTile;
    if (tile) {
      this.selectTile(tile.id);
    }
    this.patchState({ editorVisibleSidebar: value });
  }

  public sendEditorZoom(zoom: ZoomType): void {
    this.editorZoomEvent.next(zoom);
  }

  public switchEditorVisibleBg(): void {
    this.patchState({ editorVisibleBg: !this.get().editorVisibleBg });
  }

  public switchEditorVisibleGrid(): void {
    this.patchState({ editorVisibleGrid: !this.get().editorVisibleGrid });
  }

  public switchEditorDrawOverlay(): void {
    this.patchState({ editorDrawOverlay: !this.get().editorDrawOverlay });
  }

  public setEditorToolState(state: EditorToolStateType, visibleSidebar: boolean = true): void {
    const editorVisibleSidebar = state === 'draw' && !this.get().editorVisibleSidebar && visibleSidebar;
    this.patchState({ editorToolState: state, editorVisibleSidebar });
  }

  public initializeGridEdit(id: number): void {
    this.patchState({
      isCurrentTileGridInitializing: true,
      editorToolState: 'move',
      editorDrawOverlay: false,
      editorVisibleGrid: true,
      editorVisibleBg: true,
      editorVisibleSidebar: false,
      editorDrawTile: null,
      currentTileGridBg: null,
    });
    this.tilesGridService
      .getTileGrid(id)
      .pipe(
        switchMap((grid: ITilesGrid) => {
          return this.tilesGridService.getTileGridBg(grid.id).pipe(
            switchMap((gridBg: ITilesGridBg | null) => {
              this.patchState({ currentTileGridBg: gridBg });
              return of(grid);
            }),
          );
        }),
        finalize(() => this.patchState({ isCurrentTileGridInitializing: false })),
      )
      .subscribe((grid: ITilesGrid) => this.patchState({ currentTileGrid: grid }));
  }

  public saveTileGrid(
    projectId: number,
    tileId: number | null,
    tileFields: Partial<ITilesGrid>,
    tileBgId: number | null = null,
    tileBgFields: Partial<ITilesGridBg> | null = null,
  ): Observable<ITilesGrid> {
    if (tileId) {
      return this.tilesGridService.updateTileGrid(tileId, tileFields).pipe(
        switchMap((grid: ITilesGrid) => {
          if (tileBgId && tileBgFields) {
            return this.tilesGridService.updateTileGridBg(tileBgId, tileBgFields).pipe(
              switchMap((bg: ITilesGridBg) => {
                if (bg.id === this.get().currentTileGridBg?.id) {
                  this.patchState({ currentTileGridBg: bg });
                }
                return of(grid);
              }),
            );
          } else {
            return of(grid);
          }
        }),
        tap((grid: ITilesGrid) => {
          if (grid.id === this.get().currentTileGrid?.id) {
            this.patchState({ currentTileGrid: grid });
          }
          this.fetchTilesGrids(projectId);
        }),
      );
    }
    tileFields.projectId = projectId;
    return this.tilesGridService.addTileGrid(tileFields).pipe(
      switchMap((grid: ITilesGrid) => {
        if (tileBgFields) {
          tileBgFields.projectId = projectId;
          tileBgFields.gridId = grid.id;
          return this.tilesGridService.addTileGridBg(tileBgFields).pipe(
            switchMap((bg: ITilesGridBg) => {
              if (bg.id === this.get().currentTileGridBg?.id) {
                this.patchState({ currentTileGridBg: bg });
              }
              return of(grid);
            }),
          );
        } else {
          return of(grid);
        }
      }),
      tap((grid: ITilesGrid) => {
        if (grid.id === this.get().currentTileGrid?.id) {
          this.patchState({ currentTileGrid: grid });
        }
        this.fetchTilesGrids(projectId);
      }),
    );
  }

  public removeGrid(projectId: number, id: number): void {
    this.tilesGridService
      .removeTileGrid(id)
      .pipe(
        tap(() => {
          if (id === this.get().currentTileGrid?.id) {
            this.patchState({ currentTileGrid: null, currentTileGridBg: null });
          }
          this.fetchTilesGrids(projectId);
        }),
      )
      .subscribe();
  }

  public clearCurrentTileGrid(): void {
    this.patchState({ currentTileGrid: null, currentTileGridBg: null });
  }

  public fetchTilesGrids(projectId: number): void {
    this.tilesGridService
      .fetchTilesGrids(projectId)
      .pipe(tap((gridsList: ITilesGrid[]) => this.patchState({ gridsList })))
      .subscribe();
  }

  private async buildTreeFrames(treeList: ITreeItem[], framesList: IViewTile[]): Promise<IFlatTreeFrames[]> {
    const extendTree = async (items: ITreeItem[], level: number = 0): Promise<IFlatTreeFrames[]> => {
      const ret: IFlatTreeFrames[] = [];
      for (const item of items) {
        const frames: IViewTile[] = [];
        const treeFrames = framesList.filter((i: IViewTile) => i.treeId === item.id);
        for (const infoFrame of treeFrames) {
          if (!infoFrame.file) {
            continue;
          }
          const canvas = await CanvasHelper.fileToCanvas(infoFrame.file);
          frames.push({
            ...infoFrame,
            selected: false,
            canvas,
          });
        }
        // eslint-disable-next-line unused-imports/no-unused-vars
        const { children, ...obj } = item;
        ret.push({
          ...obj,
          name: level > 0 ? `${'-'.repeat(level)} ${item.name}` : item.name,
          collapse: true,
          frames,
        });
        const child = await extendTree(item.children, level + 1);
        if (child.length > 0) {
          ret.push(...child);
        }
      }
      return ret;
    };
    const tree = await extendTree(treeList);
    // Для файлов из корня дерева
    const frames = framesList.filter((i: IViewTile) => i.treeId === null);
    const tiles: IViewTile[] = [];
    for (const infoFrame of frames) {
      if (!infoFrame.file) {
        continue;
      }
      const canvas = await CanvasHelper.fileToCanvas(infoFrame.file);
      tiles.push({
        ...infoFrame,
        selected: false,
        canvas,
      });
    }
    if (tiles.length > 0) {
      tree.unshift({
        collapse: true,
        frames: tiles,
        id: 0,
        name: 'Корень дерева',
      });
    }
    return tree;
  }

  private selectTile(id: number, collapseTree: boolean = true): void {
    const tree = this.get().editorFlatTreeFrames;
    tree.forEach((item: IFlatTreeFrames) => {
      if (collapseTree) {
        let collapse = true;
        item.frames.forEach((frame: IViewTile) => {
          frame.selected = frame.id === id;
          if (frame.selected) {
            collapse = false;
          }
        });
        item.collapse = collapse;
      } else {
        item.frames.forEach((frame: IViewTile) => (frame.selected = frame.id === id));
      }
    });
  }
}
