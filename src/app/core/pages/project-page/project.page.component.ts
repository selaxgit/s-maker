import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { JSTDialogService } from '@jst/ui';
import { finalize, from } from 'rxjs';

import { SMCHeaderComponent, SMCInputTextModalComponent, SMCPageNotFoundComponent } from '../../../common/components';
import { APP_MODULES, APP_TITLE } from '../../../common/constants';
import { HtmlHelper } from '../../../common/helpers';
import { IProject } from '../../../common/interfaces';
import { ExportProjectService } from '../../../common/services/projects/export.project.service';
import { ProjectStore } from '../../../stores';

@Component({
  selector: 'app-project-page',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    MatProgressSpinnerModule,
    SMCHeaderComponent,
    SMCPageNotFoundComponent,
  ],
  templateUrl: './project.page.component.html',
  styleUrl: './project.page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPageComponent {
  readonly modulesList = APP_MODULES;

  readonly isInitializing = this.projectStore.isInitializing$;

  readonly project$ = this.projectStore.project$;

  constructor(
    protected readonly titleService: Title,
    private readonly activatedRoute: ActivatedRoute,
    private readonly jstDialogService: JSTDialogService,
    private readonly projectStore: ProjectStore,
    private readonly exportProjectService: ExportProjectService,
  ) {
    this.activatedRoute.paramMap.pipe(takeUntilDestroyed()).subscribe((params: ParamMap) => {
      this.projectStore.initialize(params.get('pid'));
    });
    this.project$.pipe(takeUntilDestroyed()).subscribe((project: IProject | null) => {
      if (project) {
        this.titleService.setTitle(`${project.name ?? ''} | ${APP_TITLE}`);
      }
    });
  }

  onChangeProject(project: IProject): void {
    HtmlHelper.blurActiveElement();
    this.jstDialogService
      .showModal<string>('Изменение проекта', SMCInputTextModalComponent, {
        label: 'Наименование проекта',
        applyTitle: 'Изменить проект',
        value: project.name,
      })
      .subscribe((value: string) => {
        if (value !== undefined) {
          this.projectStore.updateProject(project.id, {
            name: value,
          });
        }
      });
  }

  onExportProject(projectId: number): void {
    HtmlHelper.blurActiveElement();
    this.jstDialogService.showWait('Экспорт проекта...');
    from(this.exportProjectService.exportProject(projectId))
      .pipe(finalize(() => this.jstDialogService.hideWait()))
      .subscribe({
        next: () => this.jstDialogService.showToastSuccess('Файл отправлен на скачивание'),
        error: (e: Error) => this.jstDialogService.showToastError(e.message),
      });
  }
}
