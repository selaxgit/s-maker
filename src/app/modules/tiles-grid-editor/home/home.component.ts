import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { JSTDialogService } from '@jst/ui';
import { finalize, of } from 'rxjs';

import { SMCHeaderComponent, SMCPageNotFoundComponent } from '../../../common/components';
import { APP_TITLE, GRID_EDITOR_MODULE } from '../../../common/constants';
import { HtmlHelper } from '../../../common/helpers';
import { IProject, ITilesGrid } from '../../../common/interfaces';
import { ExportTilesGridService } from '../../../common/services/tiles';
import { ProjectStore, TilesGridStore } from '../../../stores';
import { TGEParamsComponent } from '../params/params.component';

@Component({
    selector: 'tge-home',
    imports: [CommonModule, MatProgressSpinnerModule, MatButtonModule, SMCHeaderComponent, SMCPageNotFoundComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TGEHomeComponent implements OnInit {
  readonly currentModule = GRID_EDITOR_MODULE;

  readonly project$ = this.projectStore.project$;

  readonly isLoading$ = this.tilesGridStore.isCurrentTileGridInitializing$;

  readonly gridsList$ = this.tilesGridStore.gridsList$;

  private destroyRef$ = inject(DestroyRef);

  constructor(
    private readonly titleService: Title,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly jstDialogService: JSTDialogService,
    private readonly projectStore: ProjectStore,
    private readonly tilesGridStore: TilesGridStore,
    private readonly exportTilesGridService: ExportTilesGridService,
  ) {
    this.activatedRoute.paramMap.pipe(takeUntilDestroyed()).subscribe((params: ParamMap) => {
      this.projectStore.initialize(params.get('pid'));
    });
  }

  ngOnInit(): void {
    this.project$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((project: IProject | null) => {
      if (project) {
        this.titleService.setTitle(`${this.currentModule.name} | ${project.name ?? ''} | ${APP_TITLE}`);
      }
    });
  }

  onGoToGrid(projectId: number, id: number): void {
    this.router.navigate([projectId, this.currentModule.code, id]);
  }

  onExportGrid(id: number): void {
    this.jstDialogService.showWait('Генерация TileGridPack...');
    of(this.exportTilesGridService.exportTileGridPack(id))
      .pipe(finalize(() => this.jstDialogService.hideWait()))
      .subscribe({
        next: () => this.jstDialogService.showToastSuccess('Архив готов и отправлен на скачивание'),
        error: (e: Error) => this.jstDialogService.showToastError(e.message),
      });
  }

  onRemoveGrid(projectId: number, id: number): void {
    this.jstDialogService
      .showConfirm('Вы действительно хотите удалить эту сетку?', 'Удаление сетки', 'Удалить сетку')
      .subscribe((confirm: boolean) => {
        if (confirm) {
          this.tilesGridStore.removeGrid(projectId, id);
        }
      });
  }

  onAddGrid(projectId: number): void {
    HtmlHelper.blurActiveElement();
    this.jstDialogService
      .showModal<ITilesGrid | undefined>(
        'Новая сетка тайлов',
        TGEParamsComponent,
        {
          projectId,
        },
        true,
      )
      .subscribe((grid: ITilesGrid | undefined) => {
        if (grid) {
          this.router.navigate([projectId, GRID_EDITOR_MODULE.code, grid.id]);
        }
      });
  }
}
