import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { SDialogService } from '@selax/ui';
import { SUFileHelper } from '@selax/utils';

import { SMCHeaderComponent } from '~components/header';
import { SMCInputTextModal } from '~components/input-text-modal';
import { ISMCListItem, SMCListItemsContainer } from '~components/list-items-container';
import { APP_TITLE } from '~constants/base.constants';
import { IProject } from '~core/interfaces';
import { ProjectsListRepository } from '~core/repositories/projects-list.repository';
import { ImportProjectService } from '~core/services';
import { ProjectsListStore } from '~core/stores';
import { ExportService } from '~services/export.service';

import * as pkg from '../../../../../../package.json';

@Component({
  selector: 'projects-list-page',
  imports: [MatButtonModule, MatIconModule, SMCHeaderComponent, SMCListItemsContainer],
  templateUrl: './projects-list.html',
  styleUrl: './projects-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsListPage implements OnInit {
  protected readonly version: string = '5.0.0';

  private readonly projectsListStore = inject(ProjectsListStore);

  protected readonly loadingState = this.projectsListStore.loadingState;

  protected readonly projectsList = computed(() => {
    const projects = this.projectsListStore.projectsList();
    if (projects) {
      return projects.map((project: IProject) => ({
        id: project.id,
        name: project.name,
      }));
    }
    return [];
  });

  private readonly titleService = inject(Title);

  private readonly router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);

  private readonly dialogService = inject(SDialogService);

  private readonly projectsListRepository = inject(ProjectsListRepository);

  private readonly exportService = inject(ExportService);

  private readonly importProjectService = inject(ImportProjectService);

  constructor() {
    this.version = pkg.version;
  }

  ngOnInit(): void {
    this.titleService.setTitle(APP_TITLE);
    this.projectsListRepository.fetchProjectsList();
  }

  handleAddProject(): void {
    this.dialogService
      .showModal<string>('Новый проект', SMCInputTextModal, {
        label: 'Наименование проекта',
        applyTitle: 'Добавить проект',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value?: string) => {
        if (value) {
          this.projectsListRepository
            .addProject(value)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((newProject: IProject) => {
              this.projectsListRepository.fetchProjectsList(true);
              this.router.navigate([newProject.id]);
            });
        }
      });
  }

  handleImportProject(): void {
    SUFileHelper.uploadFile<File>('.zip')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((file: File) => {
        this.dialogService.showWait('Импорт проекта...');
        const reader = new FileReader();
        reader.onload = async (e: ProgressEvent<FileReader>) => {
          if (e.target?.result) {
            try {
              const id = await this.importProjectService.importProject(e.target.result as ArrayBuffer);
              const errorsLog = this.importProjectService.getErrorsLogs();
              if (errorsLog.length === 0) {
                this.dialogService.showToastSuccess('Импорт проекта прошел успешно');
              } else {
                this.dialogService.showToastSuccess('Импорт проекта прошел с ошибками:<br>' + errorsLog.join('<br />'));
              }
              this.projectsListRepository.fetchProjectsList(true);
              this.router.navigate([id]);
            } catch (e: unknown) {
              if (e instanceof Error) {
                this.dialogService.showToastError(e.message || 'Ошибка при импорте проекта');
              } else {
                this.dialogService.showToastError('Ошибка при импорте проекта');
              }
            } finally {
              this.dialogService.hideWait();
            }
          }
        };
        reader.onerror = () => this.dialogService.showToastError('Ошибка чтения архива');
        reader.readAsArrayBuffer(file as File);
      });
  }

  handleExportProject(project: ISMCListItem): void {
    this.exportService.exportProject(project.id);
  }

  handleEditProject(project: ISMCListItem): void {
    this.router.navigate([project.id]);
  }

  handleRemoveProject(project: ISMCListItem): void {
    this.dialogService
      .showConfirm(`Вы действительно хотите удалить проект "${project.name}"?`, 'Удалить проект')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.projectsListRepository
            .removeProject(project.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.projectsListRepository.fetchProjectsList(true);
            });
        }
      });
  }
}
