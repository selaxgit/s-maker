import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { JSTDialogService } from '@jst/ui';
import { provideComponentStore } from '@ngrx/component-store';
import { finalize, from } from 'rxjs';

import { SMCInputTextModalComponent } from '../../../common/components';
import { APP_TITLE } from '../../../common/constants';
import { FileHelper } from '../../../common/helpers';
import { IProject } from '../../../common/interfaces';
import { FramesCacheService } from '../../../common/services/cache';
import { FramesService } from '../../../common/services/frames';
import { ExportProjectService } from '../../../common/services/projects/export.project.service';
import { ImportProjectService } from '../../../common/services/projects/import.project.service';
import { SpritesService } from '../../../common/services/sprites';
import { ProjectsStore } from '../../../stores';

@Component({
  selector: 'app-projects-list-page',
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
  providers: [provideComponentStore(ProjectsStore)],
  templateUrl: './projects-list.page.component.html',
  styleUrl: './projects-list.page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsListPageComponent {
  readonly isLoading$ = this.projectsStore.isLoading$;

  readonly projectsList$ = this.projectsStore.projectsList$;

  constructor(
    protected readonly titleService: Title,
    private readonly router: Router,
    private readonly jstDialogService: JSTDialogService,
    private readonly projectsStore: ProjectsStore,
    private readonly framesService: FramesService,
    private readonly spritesService: SpritesService,
    private readonly framesCacheService: FramesCacheService,
    private readonly exportProjectService: ExportProjectService,
    private readonly importProjectService: ImportProjectService,
  ) {
    this.framesService.clearCache();
    this.spritesService.clearCache();
    this.framesCacheService.clear();
    this.titleService.setTitle(APP_TITLE);
  }

  onExportProject(projectId: number): void {
    this.jstDialogService.showWait('Экспорт проекта...');
    from(this.exportProjectService.exportProject(projectId))
      .pipe(finalize(() => this.jstDialogService.hideWait()))
      .subscribe({
        next: () => this.jstDialogService.showToastSuccess('Файл отправлен на скачивание'),
        error: (e: Error) => this.jstDialogService.showToastError(e.message),
      });
  }

  onImportProject(): void {
    FileHelper.uploadFile<File>('.zip').subscribe((file: File) => {
      this.jstDialogService.showWait('Импорт проекта...');
      const reader = new FileReader();
      reader.onload = async (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          try {
            const id = await this.importProjectService.importProject(e.target.result as ArrayBuffer);
            this.jstDialogService.hideWait();
            this.jstDialogService.showToastSuccess('Импорт проекта прошел успешно');
            this.router.navigate([id]);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            this.jstDialogService.showToastError(error.message);
          }
        }
      };
      reader.onerror = () => this.jstDialogService.showToastError('Ошибка чтения архива');
      reader.readAsArrayBuffer(file as File);
    });
  }

  onGoToProject(id: number): void {
    this.router.navigate([id]);
  }

  onRemoveProject(id: number): void {
    this.jstDialogService
      .showConfirm('Вы действительно хотите удалить этот проект?', 'Удаление проекта', 'Удалить проект')
      .subscribe((confirm: boolean) => {
        if (confirm) {
          this.projectsStore.removeProject(id);
        }
      });
  }

  onAddProject(): void {
    this.jstDialogService
      .showModal<string | undefined>('Новый проект', SMCInputTextModalComponent, {
        label: 'Наименование проекта',
        applyTitle: 'Добавить проект',
      })
      .subscribe((value: string | undefined) => {
        if (value !== undefined) {
          this.projectsStore.addProject(value).subscribe((project: IProject) => this.router.navigate([project.id]));
        }
      });
  }
}
