import { CdkContextMenuTrigger, CdkMenuModule } from '@angular/cdk/menu';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ParamMap } from '@angular/router';
import { SDialogService, SSlidePanelService } from '@selax/ui';
import { ISUCoords } from '@selax/utils';
import { finalize } from 'rxjs';

import { SMCChoiceFramesPanel } from '~components/choice-frames-panel';
import { SMCHeaderComponent } from '~components/header';
import { SMCToolbarButtons } from '~components/toolbar-buttons';
import { APP_TITLE, TILES_GRID_EDITOR_MODULE } from '~constants/base.constants';
import { BaseProjectPageDirective } from '~core/classes/base-project-page.directive';
import { GridFacade } from '~core/facade';
import { ITilesGrid, ITilesGridItem, IViewTile } from '~core/interfaces';
import { EditGridStore } from '~core/stores/edit-grid.store';
import { PageNotFound } from '~pages/page-not-found';
import { AppPixiStateEnum } from '~pixijs/interfaces';
import { ExportService } from '~services/export.service';

import { TGEContextMenu } from '../../components/context-menu';
import { IContextMenuEvent, TGEDraw } from '../../components/draw';
import { ITGEGridParamsPanelResult, TGEGridParamsPanel } from '../../components/grid-params-panel';
import { ITGEPropertiesPanelResult, TGEPropertiesPanel } from '../../components/properties-panel';

@Component({
  selector: 'tge-home-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    CdkMenuModule,
    PageNotFound,
    SMCHeaderComponent,
    SMCToolbarButtons,
    TGEDraw,
    TGEContextMenu,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TGEHomePage extends BaseProjectPageDirective implements OnInit, OnDestroy {
  readonly editGridStore = inject(EditGridStore);

  readonly loadingGridState = signal<boolean>(true);

  readonly isHoldDrawEvent = signal<boolean>(false);

  readonly toolbarState = signal<AppPixiStateEnum>(AppPixiStateEnum.Move);

  readonly menuGridItems = signal<ITilesGridItem[]>([]);

  readonly loadingState = computed(() => this.projectStore.loadingState() || this.loadingGridState());

  readonly menuTrigger = viewChild.required<CdkContextMenuTrigger>(CdkContextMenuTrigger);

  readonly appPixiState = AppPixiStateEnum;

  private readonly dialogService = inject(SDialogService);

  private readonly slidePanelService = inject(SSlidePanelService);

  private readonly gridFacade = inject(GridFacade);

  private readonly exportService = inject(ExportService);

  private lastToolState: AppPixiStateEnum | null = null;

  private currentCellEvent: ISUCoords | null = null;

  private isPanelOpened = false;

  constructor() {
    super();
    effect(() => {
      const projectName = this.projectStore.projectName();
      const gridName = this.editGridStore.gridName();
      if (projectName) {
        this.titleService.setTitle(`${gridName} | ${TILES_GRID_EDITOR_MODULE.name} | ${projectName} | ${APP_TITLE}`);
        this.breadcrumbsStore.setPage(gridName);
      }
    });
  }

  override ngOnInit(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.breadcrumbsStore.resetPage();
    this.breadcrumbsStore.setModule(TILES_GRID_EDITOR_MODULE.name);
    this.editGridStore.showGridItemPropeties$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tile: ITilesGridItem) => {
        this.showGridItemPropetiesPanel(tile);
      });
    super.ngOnInit();
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  protected override changeActivatedRoute(params: ParamMap): void {
    const id = params.get('id');
    this.gridFacade.resetEditGrid();
    if (id === 'new') {
      this.initNewGrid();
    } else if (!id || isNaN(Number(id))) {
      this.setIs404Page(true);
      this.loadingGridState.set(false);
    } else {
      this.loadGrid(+id);
    }
  }

  handleCurrentCellEvent(coords: ISUCoords | null): void {
    this.currentCellEvent = coords;
  }

  showChoiceTilesPanel(): void {
    this.setHoldEvents(true);
    this.slidePanelService
      .showPanel$<IViewTile | null>(
        SMCChoiceFramesPanel,
        {
          panelTitle: 'Выберите фрейм для сетки',
          multiple: false,
          selectedTiles: this.editGridStore.drawFrameId() ? [this.editGridStore.drawFrameId()!] : [],
        },
        { disabledClose: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tile: IViewTile | null) => {
        this.setHoldEvents(false);
        if (tile) {
          this.editGridStore.setDrawFrameId(tile.id);
        }
      });
  }

  handleToolbarState(state: AppPixiStateEnum): void {
    this.toolbarState.set(state);
    if (!this.lastToolState && state === AppPixiStateEnum.DrawObject) {
      this.showChoiceTilesPanel();
    }
  }

  hanlePropertiesPanel(): void {
    this.setHoldEvents(true);
    this.slidePanelService
      .showPanel$<ITGEPropertiesPanelResult | null>(
        TGEPropertiesPanel,
        {
          panelTitle: 'Установить свойства для всех фреймов',
        },
        { disabledClose: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: ITGEPropertiesPanelResult | null) => {
        this.setHoldEvents(false);
        if (result) {
          this.editGridStore.updateGridAllItemProperties(result.replaceType, result.properties);
        }
      });
  }

  hanleExportGrid(): void {
    const gridId = this.editGridStore.grid()?.id ?? null;
    if (gridId) {
      this.exportService.exportGrid(gridId);
    } else {
      this.dialogService.showToastWarning('Сетка тайлов не найдена');
    }
  }

  hanleShowParamsPanel(): void {
    this.setHoldEvents(true);
    this.slidePanelService
      .showPanel$<ITGEGridParamsPanelResult | null>(
        TGEGridParamsPanel,
        {
          gridName: this.editGridStore.gridName(),
          gridParams: this.editGridStore.gridParams(),
        },
        { disabledClose: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: ITGEGridParamsPanelResult | null) => {
        this.setHoldEvents(false);
        if (result) {
          this.editGridStore.updateGridName(result.name);
          this.editGridStore.updateGridParams(result.gridParams);
        }
      });
  }

  handleRemoveGrid(): void {
    const grid = this.editGridStore.grid();
    if (!grid) {
      return;
    }
    this.dialogService
      .showConfirm(`Вы действительно хотите удалить сетку "${grid.name}"?`, 'Удалить сетку')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.gridFacade
            .removeGrid(grid.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.router.navigate([this.projectStore.projectId()]);
            });
        }
      });
  }

  handleSaveGrid(): void {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      return;
    }
    const needRedirect = this.editGridStore.grid()!.id < 0;
    this.gridFacade
      .saveGrid()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingGridState.set(false)),
      )
      .subscribe((grid: ITilesGrid) => {
        if (needRedirect) {
          const module = TILES_GRID_EDITOR_MODULE;
          this.router.navigate([projectId, module.moduleRouter, grid.id]);
        }
      });
  }

  handleContextMenu(info: IContextMenuEvent): void {
    this.menuTrigger().disabled = false;
    setTimeout(() => {
      this.menuGridItems.set(info.items);
      this.menuTrigger().open({ x: info.coords.x, y: info.coords.y });
      this.menuTrigger().disabled = true;
    });
  }

  private initNewGrid(): void {
    this.gridFacade.initNewGrid();
    this.loadingGridState.set(false);
  }

  private loadGrid(id: number): void {
    this.gridFacade
      .fetchGrid(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingGridState.set(false)),
      )
      .subscribe({
        error: () => this.setIs404Page(true),
      });
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.isPanelOpened) {
      if (this.toolbarState() !== AppPixiStateEnum.Move) {
        switch (e.code) {
          case 'Space':
            this.lastToolState = this.toolbarState();
            this.toolbarState.set(AppPixiStateEnum.Move);
            break;
          case 'Delete':
            if (
              [AppPixiStateEnum.Info, AppPixiStateEnum.RemoveObject, AppPixiStateEnum.DrawObject].includes(
                this.toolbarState(),
              )
            ) {
              if (this.currentCellEvent) {
                this.editGridStore.removeGridItemByCoords(this.currentCellEvent, -1);
              }
            }
            break;
        }
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (!this.isPanelOpened) {
      if (e.code === 'Space' && this.lastToolState) {
        this.toolbarState.set(this.lastToolState);
        this.lastToolState = null;
      }
    }
  };

  private setHoldEvents(value: boolean): void {
    this.isPanelOpened = value;
    this.isHoldDrawEvent.set(value);
  }

  showGridItemPropetiesPanel(tile: ITilesGridItem): void {
    this.setHoldEvents(true);
    const panelTitle = `Свойства тайла #${tile.frameId} (ячейка${tile.x}x${tile.y})`;
    this.slidePanelService
      .showPanel$<ITGEPropertiesPanelResult | null>(
        TGEPropertiesPanel,
        {
          panelTitle,
          tile,
          properties: tile.properties,
        },
        { disabledClose: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: ITGEPropertiesPanelResult | null) => {
        this.setHoldEvents(false);
        if (result) {
          const params = result.newFrameId
            ? { frameId: result.newFrameId, properties: result.properties }
            : { properties: result.properties };
          this.editGridStore.updateGridItemByCoords({ x: tile.x, y: tile.y }, tile.frameId, params);
        }
      });
  }
}
