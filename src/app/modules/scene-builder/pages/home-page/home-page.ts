import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ParamMap } from '@angular/router';
import { SDialogService, SSlidePanelService } from '@selax/ui';
import { finalize } from 'rxjs';

import { SMCHeaderComponent } from '~components/header';
import { APP_TITLE, SCENE_BUILDER_MODULE } from '~constants/base.constants';
import { BaseProjectPageDirective } from '~core/classes/base-project-page.directive';
import { ExportSceneTypeEnum } from '~core/constants';
import { ScenesFacade } from '~core/facade';
import { IScene } from '~core/interfaces';
import { EditSceneStore } from '~core/stores';
import { PageNotFound } from '~pages/page-not-found';
import { AppPixiStateEnum } from '~pixijs/interfaces';
import { ExportService } from '~services/export.service';

import { SBDrawContainer } from '../../components/draw-container';
import { SBSceneLayers } from '../../components/scene-layers';
import { SBOScenePropertiesPanel } from '../../components/scene-properties-panel';

@Component({
  selector: 'sb-home-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
    PageNotFound,
    SMCHeaderComponent,
    SBSceneLayers,
    SBDrawContainer,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SBHomePage extends BaseProjectPageDirective implements OnInit {
  readonly exportTypeEnum = ExportSceneTypeEnum;

  readonly editSceneStore = inject(EditSceneStore);

  readonly loadingSceneState = signal<boolean>(true);

  readonly loadingState = computed(() => this.projectStore.loadingState() || this.loadingSceneState());

  private readonly dialogService = inject(SDialogService);

  private readonly slidePanelService = inject(SSlidePanelService);

  readonly scenesFacade = inject(ScenesFacade);

  private readonly exportService = inject(ExportService);

  constructor() {
    super();
    effect(() => {
      const projectName = this.projectStore.projectName();
      const sceneName = this.editSceneStore.sceneName();
      if (projectName) {
        this.titleService.setTitle(`${sceneName} | ${SCENE_BUILDER_MODULE.name} | ${projectName} | ${APP_TITLE}`);
        this.breadcrumbsStore.setPage(sceneName);
      }
    });
  }

  override ngOnInit(): void {
    this.breadcrumbsStore.resetPage();
    this.breadcrumbsStore.setModule(SCENE_BUILDER_MODULE.name);
    this.editSceneStore.setStatusbarText(null);
    this.editSceneStore.setToolbarState(AppPixiStateEnum.Move);
    this.editSceneStore.setCurrent(null);
    super.ngOnInit();
  }

  protected override changeActivatedRoute(params: ParamMap): void {
    const id = params.get('id');
    this.scenesFacade.resetEditScene();
    if (id === 'new') {
      this.initNewScene();
    } else if (!id || isNaN(Number(id))) {
      this.setIs404Page(true);
      this.loadingSceneState.set(false);
    } else {
      this.loadScene(+id);
    }
  }

  handleSaveScene(): void {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      return;
    }
    const needRedirect = this.editSceneStore.scene()!.id < 0;
    this.scenesFacade
      .saveScene()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingSceneState.set(false)),
      )
      .subscribe((scene: IScene) => {
        if (needRedirect) {
          const module = SCENE_BUILDER_MODULE;
          this.router.navigate([projectId, module.moduleRouter, scene.id]);
        }
      });
  }

  handleShowParamsScene(): void {
    const scene = this.editSceneStore.scene();
    if (!scene) {
      return;
    }
    this.slidePanelService
      .showPanel$<Partial<IScene> | null>(
        SBOScenePropertiesPanel,
        {
          scene,
        },
        { disabledClose: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: Partial<IScene> | null) => {
        if (result) {
          this.editSceneStore.updateScene(result);
        }
      });
  }

  handleRemoveScene(): void {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      return;
    }
    this.dialogService
      .showConfirm(`Вы действительно хотите удалить эту сцену?`, 'Удаление сцены', 'Удалить сцену')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isOK: boolean) => {
        if (isOK) {
          this.scenesFacade
            .removeScene(this.editSceneStore.scene()!.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.router.navigate([projectId]);
            });
        }
      });
  }

  handleExportScene(type: ExportSceneTypeEnum): void {
    this.exportService.exportScene(this.editSceneStore.scene()!.id, type);
  }

  private initNewScene(): void {
    this.scenesFacade.initNewScene();
    this.loadingSceneState.set(false);
  }

  private loadScene(id: number): void {
    this.scenesFacade
      .fetchScene(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingSceneState.set(false)),
      )
      .subscribe({
        error: () => this.setIs404Page(true),
      });
  }
}
