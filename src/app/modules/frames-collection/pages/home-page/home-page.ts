import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SDialogService, SSlidePanelService } from '@selax/ui';
import { SUFileHelper } from '@selax/utils';
import { finalize, lastValueFrom } from 'rxjs';

import { SMCHeaderComponent } from '~components/header';
import { APP_TITLE, FRAMES_COLLECTION_MODULE } from '~constants/base.constants';
import { BaseProjectPageDirective } from '~core/classes/base-project-page.directive';
import { FramesSortByEnum } from '~core/constants';
import { FramesFacade } from '~core/facade';
import { FramesStore } from '~core/stores';
import { PageNotFound } from '~pages/page-not-found';

import { FCCutFrames } from '../../components/cut-frames';
import { FCCutSingleFramePanel } from '../../components/cut-single-frame';
import { FCFramesList } from '../../components/frames-list';
import { FCFramesTree } from '../../components/frames-tree';

@Component({
  selector: 'fc-home-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
    PageNotFound,
    SMCHeaderComponent,
    FCFramesTree,
    FCFramesList,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FCHomePagePage extends BaseProjectPageDirective implements OnInit {
  readonly framesSortBy = FramesSortByEnum;

  readonly framesStore = inject(FramesStore);

  private readonly dialogService = inject(SDialogService);

  private readonly slidePanelService = inject(SSlidePanelService);

  private readonly framesFacade = inject(FramesFacade);

  constructor() {
    super();
    effect(() => {
      const projectName = this.projectStore.projectName();
      if (projectName) {
        this.titleService.setTitle(`${FRAMES_COLLECTION_MODULE.name} | ${projectName} | ${APP_TITLE}`);
      }
    });
  }

  override ngOnInit(): void {
    this.breadcrumbsStore.resetPage();
    this.breadcrumbsStore.setModule(FRAMES_COLLECTION_MODULE.name);
    super.ngOnInit();
  }

  handlenAddFromFile(): void {
    SUFileHelper.uploadFile<FileList>('image/*', true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (files: FileList) => {
        this.addFramesFromFiles(files);
      });
  }

  handleCutFramesFromFile(): void {
    this.dialogService
      .showModal<FileList | null>('Нарезать фреймы из файла', FCCutFrames, {}, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((files: FileList | null | undefined) => {
        if (files) {
          this.addFramesFromFiles(files, 'Сохранение нарезанных фреймов...');
        }
      });
  }

  handleCutSingleFrameFromFile(): void {
    this.slidePanelService
      .showPanel$<File | null>(FCCutSingleFramePanel, {}, { disabledClose: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((file: File | null) => {
        if (file instanceof File) {
          const dt = new DataTransfer();
          dt.items.add(file);
          this.addFramesFromFiles(dt.files, 'Сохранение вырезанного фрейма...');
        }
      });
  }

  handleRemoveNotUsed(): void {
    this.dialogService
      .showConfirm('Вы уверены, что хотите удалить все неиспользуемые фреймы в этой ветке?')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.removeNotUsedFrames();
        }
      });
  }

  handleRemoveDuplicates(): void {
    this.dialogService
      .showConfirm('Вы уверены, что хотите удалить дубликаты фреймов в этой ветке?')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.removeDuplicates();
        }
      });
  }

  setSortBy(sortBy: FramesSortByEnum): void {
    this.framesStore.setSortBy(sortBy);
  }

  removeDuplicates(): void {
    this.dialogService.showWait('Удаление дублей фреймов...');
    this.framesFacade
      .removeDuplicates(
        (message: string) => this.dialogService.showWait(message),
        (message: string) => this.dialogService.showToastError(message),
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.dialogService.hideWait()),
      )
      .subscribe();
  }

  private removeNotUsedFrames(): void {
    this.dialogService.showWait('Удаление неиспользуемых фреймов в этой ветке...');
    this.framesFacade
      .removeNotUsedFrames()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.dialogService.hideWait()),
      )
      .subscribe();
  }

  private async addFramesFromFiles(
    files: FileList,
    message: string = 'Добавление фреймов из файлов...',
  ): Promise<void> {
    this.dialogService.showWait(message);
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (file) {
        await lastValueFrom(this.framesFacade.addFrameFromFile(file));
      }
    }
    this.dialogService.hideWait();
  }
}
