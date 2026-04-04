import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SDialogService } from '@selax/ui';

import { SMCHeaderComponent } from '~components/header';
import { SMCInputTextModal } from '~components/input-text-modal';
import { ISMCListItem, SMCListItemsContainer } from '~components/list-items-container';
import { APP_TITLE, MODULES_LIST } from '~constants/base.constants';
import { BaseProjectPageDirective } from '~core/classes/base-project-page.directive';
import { ExportSceneTypeEnum } from '~core/constants';
import { GridFacade, ScenesFacade } from '~core/facade';
import { IScene, ITilesGrid } from '~core/interfaces';
import { ScenesListStore } from '~core/stores';
import { GridListStore } from '~core/stores/grid-list.store';
import { IModule } from '~interfaces/base.interface';
import { PageNotFound } from '~pages/page-not-found';
import { ExportService } from '~services/export.service';

const BUTTON_MODULES = ['fc', 'sc', 'lg'];

@Component({
  selector: 'projects-home-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageNotFound,
    SMCHeaderComponent,
    SMCListItemsContainer,
  ],
  templateUrl: './project-home.html',
  styleUrl: './project-home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectHomePage extends BaseProjectPageDirective implements OnInit {
  readonly modulesList = MODULES_LIST.filter((module: IModule) => BUTTON_MODULES.includes(module.code));

  readonly tgeModule = MODULES_LIST.find((module: IModule) => module.code === 'tge') ?? null;

  readonly sbModule = MODULES_LIST.find((module: IModule) => module.code === 'sb') ?? null;

  readonly loadingState = this.projectStore.loadingState;

  protected readonly gridList = computed(() => {
    const gridList = this.gridListStore.gridList();
    if (gridList) {
      return gridList.map((grid: ITilesGrid) => ({
        id: grid.id,
        name: grid.name,
      }));
    }
    return [];
  });

  protected readonly scenesList = computed(() => {
    const scenesList = this.scenesListStore.scenesList();
    if (scenesList) {
      return scenesList.map((scene: IScene) => ({
        id: scene.id,
        name: scene.name,
      }));
    }
    return [];
  });

  private readonly dialogService = inject(SDialogService);

  private readonly gridListStore = inject(GridListStore);

  private readonly scenesListStore = inject(ScenesListStore);

  private readonly gridFacade = inject(GridFacade);

  private readonly scenesFacade = inject(ScenesFacade);

  private readonly exportService = inject(ExportService);

  constructor() {
    super();
    effect(() => {
      const projectName = this.projectStore.projectName();
      if (projectName) {
        this.titleService.setTitle(`${projectName} | ${APP_TITLE}`);
      }
    });
  }

  override ngOnInit(): void {
    this.breadcrumbsStore.resetModule();
    this.breadcrumbsStore.resetPage();
    super.ngOnInit();
  }

  openModule(module: IModule, params: string | number | null = null): void {
    const projectId = this.projectStore.projectId();
    if (projectId) {
      const route = params ? [projectId, module.moduleRouter, params] : [projectId, module.moduleRouter];
      this.router.navigate(route);
    }
  }

  handleExportScene(item: ISMCListItem): void {
    this.exportService.exportScene(item.id, ExportSceneTypeEnum.Full);
  }

  handleExportGrid(item: ISMCListItem): void {
    this.exportService.exportGrid(item.id);
  }

  handleRemoveGrid(item: ISMCListItem): void {
    this.dialogService
      .showConfirm(`Вы действительно хотите удалить сетку "${item.name}"?`, 'Удалить сетку')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.gridFacade.removeGrid(item.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
        }
      });
  }

  handleRemoveScene(item: ISMCListItem): void {
    this.dialogService
      .showConfirm(`Вы действительно хотите удалить сцену "${item.name}"?`, 'Удалить сцену')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.scenesFacade.removeScene(item.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
        }
      });
  }

  handleExportProject(): void {
    const projectId = this.projectStore.projectId() ?? null;
    if (projectId) {
      this.exportService.exportProject(projectId);
    } else {
      this.dialogService.showToastWarning('Проект не найден');
    }
  }

  handleEditProject(): void {
    this.dialogService
      .showModal<string>('Изменение проекта', SMCInputTextModal, {
        label: 'Наименование проекта',
        applyTitle: 'Сохранить изменения',
        value: this.projectStore.projectName() ?? undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value?: string) => {
        if (value) {
          this.projectFacade.updateProject(this.projectStore.projectId()!, value).subscribe();
        }
      });
  }
}
