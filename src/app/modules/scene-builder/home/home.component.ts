import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { JSTDialogService } from '@jst/ui';
import { finalize, from } from 'rxjs';

import { SMCHeaderComponent, SMCInputTextModalComponent, SMCPageNotFoundComponent } from '../../../common/components';
import { APP_TITLE, SCENE_BUILDER_MODULE } from '../../../common/constants';
import { HtmlHelper } from '../../../common/helpers';
import { IProject, IScene } from '../../../common/interfaces';
import { ExportSceneService } from '../../../common/services/scenes';
import { ProjectStore } from '../../../stores';
import { ScenesStore } from '../../../stores/scenes.store';

@Component({
    selector: 'sb-home',
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatMenuModule,
        MatIconModule,
        SMCHeaderComponent,
        SMCPageNotFoundComponent,
    ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SBHomeComponent implements OnInit {
  readonly currentModule = SCENE_BUILDER_MODULE;

  readonly project$ = this.projectStore.project$;

  readonly isLoading$ = this.scenesStore.isLoading$;

  readonly scenesList$ = this.scenesStore.scenesList$;

  private destroyRef$ = inject(DestroyRef);

  constructor(
    protected readonly titleService: Title,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly jstDialogService: JSTDialogService,
    private readonly projectStore: ProjectStore,
    private readonly scenesStore: ScenesStore,
    private readonly exportSceneService: ExportSceneService,
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

  onGoToScene(projectId: number, id: number): void {
    this.router.navigate([projectId, this.currentModule.code, id]);
  }

  onExportScene(id: number): void {
    this.jstDialogService.showWait('Генерация SceneFile...');
    from(this.exportSceneService.exportScene(id))
      .pipe(finalize(() => this.jstDialogService.hideWait()))
      .subscribe({
        next: () => this.jstDialogService.showToastSuccess('Файл отправлен на скачивание'),
        error: (e: Error) => this.jstDialogService.showToastError(e.message),
      });
  }

  onExportScenePack(id: number): void {
    this.jstDialogService.showWait('Генерация ScenePack...');
    from(this.exportSceneService.exportScenePack(id))
      .pipe(finalize(() => this.jstDialogService.hideWait()))
      .subscribe({
        next: () => this.jstDialogService.showToastSuccess('Архив готов и отправлен на скачивание'),
        error: (e: Error) => this.jstDialogService.showToastError(e.message),
      });
  }

  onRemoveScene(projectId: number, id: number): void {
    this.jstDialogService
      .showConfirm('Вы действительно хотите удалить эту сцену?', 'Удаление сцены', 'Удалить сцену')
      .subscribe((confirm: boolean) => {
        if (confirm) {
          this.scenesStore.removeScene(projectId, id);
        }
      });
  }

  onAddScene(projectId: number): void {
    HtmlHelper.blurActiveElement();
    this.jstDialogService
      .showModal<string | undefined>(
        'Новая сцена',
        SMCInputTextModalComponent,
        {
          label: 'Наименование сцены',
          applyTitle: 'Добавить сцену',
        },
        true,
      )
      .subscribe((value: string | undefined) => {
        if (value !== undefined) {
          this.scenesStore
            .addScene(projectId, value)
            .subscribe((scene: IScene) => this.router.navigate([projectId, this.currentModule.code, scene.id]));
        }
      });
  }
}
