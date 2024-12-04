import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostBinding,
  inject,
  OnDestroy,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';

import { AppPixi } from '../../../../common/classes';
import {
  EditorToolStateType,
  ICoords,
  IFlatTreeFrames,
  IStoreKeyCanvas,
  ITilesGrid,
  ITilesGridBg,
  IViewTile,
  ZoomType,
} from '../../../../common/interfaces';
import { TilesGridStore } from '../../../../stores';
import { DrawContainer } from './pixi';

@Component({
    selector: 'tge-edit-draw',
    imports: [CommonModule],
    templateUrl: './draw.component.html',
    styleUrl: './draw.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TGEEditDrawComponent implements AfterViewInit, OnDestroy {
  initializingFrames: WritableSignal<boolean> = signal(true);

  private readonly appPixi = new AppPixi();

  private readonly drawContainer = new DrawContainer();

  private readonly destroyRef$ = inject(DestroyRef);

  private cursor = 'move';

  private toolState: EditorToolStateType = 'move';

  private lastToolState: EditorToolStateType | null = null;

  private storeKeyCanvas: IStoreKeyCanvas | null = null;

  private currentCoord: ICoords | null = null;

  constructor(
    public readonly tilesGridStore: TilesGridStore,
    private readonly elementRef: ElementRef,
  ) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  @HostBinding('style.cursor') get cursorStyle(): string {
    return this.cursor;
  }

  ngAfterViewInit(): void {
    this.initializePixi();
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.tilesGridStore.clearCurrentTileGrid();
    this.appPixi.destroy();
  }

  private initializePixi(): void {
    this.appPixi.useScale = true;
    this.appPixi.initialize(this.elementRef.nativeElement).then(() => {
      this.appPixi.attachScaleContainer(this.drawContainer);
      this.initializeSubscriptions();
    });
  }

  private initializeSubscriptions(): void {
    combineLatest([this.tilesGridStore.currentTileGrid$, this.tilesGridStore.editorFlatTreeFrames$])
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe(([grid, treeFrames]: [ITilesGrid | null, IFlatTreeFrames[]]) => {
        if (treeFrames.length > 0) {
          if (this.storeKeyCanvas === null) {
            this.storeKeyCanvas = {};
            for (const tree of treeFrames) {
              for (const frame of tree.frames) {
                if (frame.canvas) {
                  this.storeKeyCanvas[frame.id] = frame.canvas;
                }
              }
            }
          }
          if (grid) {
            this.drawContainer.drawGrid(grid.mapInfo, grid.tileInfo, grid.items, this.storeKeyCanvas);
          }
        }
      });
    this.tilesGridStore.initializingFrameTree$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((init: boolean) => this.initializingFrames.set(init));
    this.tilesGridStore.currentTileGridBg$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((gridBg: ITilesGridBg | null) => {
        this.drawContainer.drawBackground(gridBg);
      });
    this.tilesGridStore.editorVisibleGrid$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((visible: boolean) => {
      this.drawContainer.setVisibleGrid(visible);
    });
    this.tilesGridStore.editorVisibleBg$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((visible: boolean) => {
      this.drawContainer.setVisibleBackground(visible);
    });
    this.tilesGridStore.editorDrawOverlay$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((visible: boolean) => {
      this.drawContainer.setModeOverlay(visible);
    });
    this.tilesGridStore.editorDrawTile$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((tile: IViewTile | null) => {
        this.drawContainer.setDrawTile(tile);
      });
    this.tilesGridStore.editorZoomEvent$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((zoom: ZoomType) => this.appPixi.setZoom(zoom, false));
    this.tilesGridStore.editorToolState$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((state: EditorToolStateType) => {
        this.toolState = state;
        this.drawContainer.toolState = state;
        this.appPixi.useMove = state === 'move';
        switch (state) {
          case 'move':
            this.cursor = 'move';
            break;
          case 'info':
            this.cursor = 'help';
            break;
          case 'remove':
            this.cursor = 'crosshair';
            break;
          case 'draw':
            this.cursor = 'grabbing';
            break;
          default:
            this.cursor = 'default';
        }
      });

    this.drawContainer.cellOverEvent.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((coords: ICoords | null) => {
      this.tilesGridStore.setEditorCurrentCoords(coords);
      this.currentCoord = coords;
    });
    this.drawContainer.cellClickEvent.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((coords: ICoords) => {
      if (this.toolState === 'info') {
        this.tilesGridStore.showContextMenu(coords);
      }
    });
    this.drawContainer.cellHasDrawEvent.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((coords: ICoords[]) => {
      this.tilesGridStore.setEditorDrawByCoors(coords);
    });
    this.drawContainer.cellHasRemoveEvent.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((coords: ICoords[]) => {
      this.tilesGridStore.setEditorRemoveByCoors(coords);
    });
  }

  private clearTilesByCoord(coords: ICoords | null): void {
    if (coords) {
      if (this.drawContainer.clearTilesByCoord(coords)) {
        this.tilesGridStore.setEditorRemoveByCoors([coords]);
      }
    }
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (document.activeElement?.tagName === 'INPUT') {
      return;
    }
    if (this.toolState !== 'move') {
      switch (e.code) {
        case 'Space':
          this.lastToolState = this.toolState;
          this.tilesGridStore.setEditorToolState('move');
          break;
        case 'Delete':
          this.clearTilesByCoord(this.currentCoord);
          break;
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (document.activeElement?.tagName === 'INPUT') {
      return;
    }
    if (e.code === 'Space' && this.lastToolState) {
      this.tilesGridStore.setEditorToolState(this.lastToolState, false);
      this.lastToolState = null;
    }
  };
}
