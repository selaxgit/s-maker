import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
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
import { APP_TITLE, SCENE_BUILDER_MODULE } from '../../../common/constants';
import { HtmlHelper } from '../../../common/helpers';
import { IProject, IScene, ISceneObject } from '../../../common/interfaces';
import { ExportSceneService } from '../../../common/services/scenes';
import { ProjectStore } from '../../../stores';
import { ScenesStore } from '../../../stores/scenes.store';
import { SBParamsComponent } from '../params/params.component';
import { SBEditDrawComponent } from './draw/draw.component';
import { SBEditSidebarComponent } from './sidebar/sidebar.component';
import { SBEditStatusbarComponent } from './statusbar/statusbar.component';
import { SBEditToolbarComponent } from './toolbar/toolbar.component';

@Component({
    selector: 'sb-edit',
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        SMCHeaderComponent,
        SMCPageNotFoundComponent,
        SBEditToolbarComponent,
        SBEditStatusbarComponent,
        SBEditDrawComponent,
        SBEditSidebarComponent,
    ],
    templateUrl: './edit.component.html',
    styleUrl: './edit.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SBEditComponent {
  readonly currentModule = SCENE_BUILDER_MODULE;

  constructor(
    public readonly projectStore: ProjectStore,
    public readonly scenesStore: ScenesStore,
    private readonly titleService: Title,
    private readonly activatedRoute: ActivatedRoute,
    private readonly jstDialogService: JSTDialogService,
    private readonly exportSceneService: ExportSceneService,
  ) {
    this.activatedRoute.paramMap.pipe(takeUntilDestroyed()).subscribe((params: ParamMap) => {
      this.projectStore.initialize(params.get('pid'));
      this.scenesStore.initializeScene(Number(params.get('id')));
    });
    combineLatest([this.projectStore.project$, this.scenesStore.currentScene$])
      .pipe(takeUntilDestroyed())
      .subscribe(([project, scene]: [IProject | null, IScene | null]) => {
        if (project && scene) {
          this.titleService.setTitle(`${scene.name} | ${this.currentModule.name} | ${project.name} | ${APP_TITLE}`);
        }
      });
  }

  onSceneParams(scene: IScene): void {
    HtmlHelper.blurActiveElement();
    this.scenesStore.editorSceneObjects$.pipe(take(1)).subscribe((layers: ISceneObject[]) => {
      const layersList = layers
        .filter((i: ISceneObject) => i.type === 'layer-sprites')
        .map((i: ISceneObject) => ({
          value: i.id,
          title: i.name,
        }));

      this.jstDialogService
        .showModal<IScene | undefined>(
          'Новая сетка тайлов',
          SBParamsComponent,
          {
            scene,
            layersList,
          },
          true,
        )
        .subscribe((sceneInfo: IScene | undefined) => {
          if (sceneInfo) {
            this.scenesStore.updateScene(scene.id, sceneInfo);
          }
        });
    });
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
}
