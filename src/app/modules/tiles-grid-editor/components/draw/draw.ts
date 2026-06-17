import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ISUCoords } from '@selax/utils';

import { ITilesGridItem, ITilesGridParams } from '~core/interfaces';
import { PixiAppService } from '~core/services';
import { EditGridStore } from '~core/stores/edit-grid.store';
import { AppPixiStateEnum, ZoomEnum } from '~pixijs/interfaces';

import { GridApp } from './pixijs/grid.app';

export interface IContextMenuEvent {
  coords: ISUCoords;
  items: ITilesGridItem[];
}

@Component({
  selector: 'tge-draw',
  imports: [],
  templateUrl: './draw.html',
  styleUrl: './draw.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(contextmenu)': 'handleContextMenu($event)',
  },
})
export class TGEDraw implements AfterViewInit, OnDestroy {
  readonly toolbarState = input<AppPixiStateEnum>(AppPixiStateEnum.Move);

  readonly isHoldDrawEvent = input<boolean>(false);

  readonly contextMenuEvent = output<IContextMenuEvent>();

  readonly currentCellEvent = output<ISUCoords | null>();

  private readonly editGridStore = inject(EditGridStore);

  private readonly appPixiRef = viewChild.required<ElementRef<HTMLDivElement>>('appPixi');

  private readonly pixiAppService = inject(PixiAppService);

  private readonly gridApp = new GridApp(this.pixiAppService);

  constructor() {
    this.editGridStore.zoomState$.pipe(takeUntilDestroyed()).subscribe((zoom: ZoomEnum) => {
      if (this.gridApp.isInitialized) {
        this.gridApp.setZoom(zoom);
      }
    });
    effect(() => {
      const toolbarState = this.toolbarState();
      if (this.gridApp.isInitialized) {
        this.gridApp.state = toolbarState;
      }
    });
    effect(() => this.drawGrid(this.editGridStore.gridParams()));
    effect(() => this.gridApp.drawItems(this.editGridStore.gridItems()));
    effect(() => this.gridApp.setDrawTile(this.editGridStore.drawFrameId()));
    effect(() => (this.gridApp.isContextMenuOpened = this.editGridStore.contextMenuOpened()));
    effect(() => (this.gridApp.isHoldEvent = this.isHoldDrawEvent()));
    effect(() => {
      this.gridApp.visibleBackground = this.editGridStore.visibleBackground();
      this.gridApp.visibleGrid = this.editGridStore.visibleGrid();
    });
    effect(() => {
      this.gridApp.topBackground = this.editGridStore.topBackground();
    });
  }

  private async drawGrid(params: ITilesGridParams | null): Promise<void> {
    await this.gridApp.drawGrid(params);
    if (params && this.editGridStore.gridItems()) {
      await this.gridApp.drawItems(this.editGridStore.gridItems());
    }
  }

  ngAfterViewInit(): void {
    this.initializePixi();
  }

  ngOnDestroy(): void {
    if (this.gridApp) {
      this.gridApp.destroy();
    }
  }

  protected handleContextMenu(e: PointerEvent): void {
    e.preventDefault();
    this.onContextMenu({ x: e.clientX, y: e.clientY });
  }

  private async initializePixi(): Promise<void> {
    if (this.appPixiRef()?.nativeElement) {
      await this.gridApp.initialize(this.appPixiRef()!.nativeElement);
      this.gridApp.state = AppPixiStateEnum.Move;
      this.gridApp.onCellCoordsHover = (coords: ISUCoords | null): void => {
        this.editGridStore.setCurrentCell(coords);
        this.currentCellEvent.emit(coords);
      };
      this.gridApp.onCellEnter = (coords: ISUCoords | null): void => this.onMouseDownCell(coords);
      this.gridApp.onCellDown = (coords: ISUCoords | null): void => this.onMouseDownCell(coords);
      this.gridApp.onCellUp = (mouseCoords: ISUCoords): void => {
        if (this.gridApp.state === AppPixiStateEnum.Info) {
          this.onContextMenu(mouseCoords);
        }
      };
    }
  }

  private onMouseDownCell(coords: ISUCoords | null): void {
    if (coords) {
      const drawTileId = this.gridApp.drawTileId;
      switch (this.gridApp.state) {
        case AppPixiStateEnum.DrawObject:
          if (drawTileId) {
            this.editGridStore.addGridItem(drawTileId, coords);
          }
          break;
        case AppPixiStateEnum.RemoveObject:
          this.editGridStore.removeGridItemByCoords(coords, -1);
          break;
      }
    }
  }

  private onContextMenu(menuCoords: ISUCoords): void {
    if (this.gridApp.state !== AppPixiStateEnum.DrawObject) {
      const items = this.editGridStore.getGridItemsbyCoords(this.gridApp.currentCellCoords);
      if (items.length > 0) {
        this.contextMenuEvent.emit({ coords: menuCoords, items });
      }
    }
  }
}
