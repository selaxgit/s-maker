import { CdkContextMenuTrigger, CdkMenuModule } from '@angular/cdk/menu';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { JSTDialogService } from '@jst/ui';
import { combineLatest, finalize, from, take } from 'rxjs';

import { SMCHeaderComponent, SMCPageNotFoundComponent } from '../../../common/components';
import { APP_TITLE, GRID_EDITOR_MODULE } from '../../../common/constants';
import { HtmlHelper } from '../../../common/helpers';
import { ICoords, IProject, ITilesGrid, ITilesGridBg, ITilesGridItem, IViewTile } from '../../../common/interfaces';
import { FramesService } from '../../../common/services/frames';
import { ExportTilesGridService } from '../../../common/services/tiles';
import { ProjectStore, TilesGridStore } from '../../../stores';
import { TGEParamsComponent } from '../params/params.component';
import { TGEContextMenuComponent } from './context-menu/context-menu.component';
import { TGEEditDrawComponent } from './draw/draw.component';
import {
  IPropertyForAllModalResult,
  TGEPropertyForAllModalComponent,
} from './property-for-all-modal/property-for-all-modal.component';
import { TGEEditSidebarComponent } from './sidebar/sidebar.component';
import { TGEEditStatusbarComponent } from './statusbar/statusbar.component';
import { ITileInfoResultModal, TGETileInfoModalComponent } from './tile-info-modal/tile-info-modal.component';
import { TGEEditToolbarComponent } from './toolbar/toolbar.component';

@Component({
    selector: 'tge-edit',
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        CdkMenuModule,
        SMCHeaderComponent,
        SMCPageNotFoundComponent,
        TGEEditToolbarComponent,
        TGEEditStatusbarComponent,
        TGEEditSidebarComponent,
        TGEEditDrawComponent,
        TGEContextMenuComponent,
    ],
    templateUrl: './edit.component.html',
    styleUrl: './edit.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TGEEditComponent implements OnInit {
  @ViewChild(CdkContextMenuTrigger) menuTrigger!: CdkContextMenuTrigger;

  readonly currentModule = GRID_EDITOR_MODULE;

  private readonly destroyRef$ = inject(DestroyRef);

  constructor(
    public readonly projectStore: ProjectStore,
    public readonly tilesGridStore: TilesGridStore,
    private readonly titleService: Title,
    private readonly activatedRoute: ActivatedRoute,
    private readonly jstDialogService: JSTDialogService,
    private readonly framesService: FramesService,
    private readonly exportTilesGridService: ExportTilesGridService,
  ) {
    this.activatedRoute.paramMap.pipe(takeUntilDestroyed()).subscribe((params: ParamMap) => {
      this.projectStore.initialize(params.get('pid'));
      this.tilesGridStore.initializeGridEdit(Number(params.get('id')));
    });
    this.projectStore.project$.pipe(takeUntilDestroyed()).subscribe((project: IProject | null) => {
      if (project) {
        this.tilesGridStore.initializeFramesFlatTree(project.id);
      }
    });
    combineLatest([this.projectStore.project$, this.tilesGridStore.currentTileGrid$])
      .pipe(takeUntilDestroyed())
      .subscribe(([project, grid]: [IProject | null, ITilesGrid | null]) => {
        if (project && grid) {
          this.titleService.setTitle(`${grid.name} | ${this.currentModule.name} | ${project.name} | ${APP_TITLE}`);
        }
      });
  }

  ngOnInit(): void {
    this.tilesGridStore.editorContextMenu$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((coords: ICoords | null) => {
        if (coords) {
          setTimeout(() => this.menuTrigger.open({ x: coords.x, y: coords.y }));
        }
      });
    this.tilesGridStore.editorShowTileInfo$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((tile: ITilesGridItem | null) => {
        if (tile) {
          this.showTileInfoPopup(tile);
        }
      });
  }

  onExportGrid(id: number): void {
    this.jstDialogService.showWait('Генерация TileGridPack...');
    from(this.exportTilesGridService.exportTileGridPack(id))
      .pipe(finalize(() => this.jstDialogService.hideWait()))
      .subscribe({
        next: () => this.jstDialogService.showToastSuccess('Архив готов и отправлен на скачивание'),
        error: (e: Error) => this.jstDialogService.showToastError(e.message),
      });
  }

  onGridParams(projectId: number, grid: ITilesGrid): void {
    HtmlHelper.blurActiveElement();
    this.tilesGridStore.currentTileGridBg$.pipe(take(1)).subscribe((gridBg: ITilesGridBg | null) => {
      this.jstDialogService
        .showModal<void>(
          'Параметры сетки тайлов',
          TGEParamsComponent,
          {
            projectId,
            tilesGrid: grid,
            tilesGridBg: gridBg,
          },
          true,
        )
        .subscribe();
    });
  }

  onUtils(utilName: 'set-property-for-all'): void {
    switch (utilName) {
      case 'set-property-for-all':
        this.setPropertyForAll();
        break;
    }
  }

  private showTileInfoPopup(tile: ITilesGridItem): void {
    if (!tile.referenceId) {
      return;
    }
    this.framesService.fetchTileById(tile.referenceId).subscribe((frame: IViewTile) => {
      const title = `Свойства тайла #${frame.id} (ячейка: ${tile.x}x${tile.y})`;
      this.jstDialogService
        .showModal<ITileInfoResultModal | undefined>(
          title,
          TGETileInfoModalComponent,
          {
            tile,
            frame,
          },
          true,
          false,
        )
        .subscribe((data: ITileInfoResultModal | undefined) => {
          if (data?.coords && data?.referenceId) {
            this.tilesGridStore.updateTileInGrid(data.coords, data.referenceId, data.props);
          }
        });
    });
  }

  private setPropertyForAll(): void {
    this.jstDialogService
      .showModal<
        IPropertyForAllModalResult | undefined
      >('Установить свойства для всех тайлов', TGEPropertyForAllModalComponent, {}, true, false)
      .subscribe((data: IPropertyForAllModalResult | undefined) => {
        if (data?.replaceType && data?.properties) {
          this.tilesGridStore.updateTilesPropertiesInGrid(data.replaceType, data.properties);
        }
      });
  }
}
