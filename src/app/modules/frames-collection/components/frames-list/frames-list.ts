import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SDialogService, SSlidePanelService } from '@selax/ui';
import { SUFileHelper } from '@selax/utils';
import { finalize } from 'rxjs';

import { SMCTilesList } from '~components/tiles-list';
import { SMCDragTypeEnum } from '~constants/drag.constants';
import { IFrame, IViewTile } from '~core/interfaces';
import { FramesRepository } from '~core/repositories';
import { FramesStore } from '~core/stores';

import { FCViewFramePanel } from '../view-frame-panel';

@Component({
  selector: 'fc-frames-list',
  imports: [SMCTilesList],
  templateUrl: './frames-list.html',
  styleUrl: './frames-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FCFramesList {
  readonly dragType = SMCDragTypeEnum;

  readonly framesStore = inject(FramesStore);

  private readonly destroyRef = inject(DestroyRef);

  private readonly dialogService = inject(SDialogService);

  private readonly slidePanelService = inject(SSlidePanelService);

  private readonly framesRepository = inject(FramesRepository);

  handleRemoveTile(tile: IViewTile): void {
    this.dialogService
      .showConfirm(`Вы действительно хотите удалить этот фрейм?`, 'Удаление фрейма', 'Удалить фрейм')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isOK: boolean) => {
        if (isOK) {
          this.framesRepository.removeFrame(tile.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
        }
      });
  }

  handleDownloadTile(tile: IViewTile): void {
    this.dialogService.showWait('Подготовка к загрузке...');
    this.framesRepository
      .fetchFrameById(tile.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.dialogService.hideWait()),
      )
      .subscribe({
        next: (frame: IFrame) => {
          if (frame && frame.file) {
            const extFile = frame.file.type.includes('/') ? frame.file.type.split('/').pop() : null;
            const extFileName = frame.file.name.includes('.') ? frame.file.name.split('.').pop() : null;
            const extName = frame.name.includes('.') ? frame.name.split('.').pop() : null;
            const ext = extFile || extName || extFileName || 'png';
            const filename = `${frame.name}.${ext}`;
            SUFileHelper.downloadBlob(filename, frame.file);
            this.dialogService.showToastSuccess(`Файл фрейма (${filename}) скачен успешно`);
          } else {
            this.dialogService.showToastError('Файл фрейма не найден');
          }
        },
        error: (err: Error) => {
          this.dialogService.showToastError(err.message || 'Ошибка при загрузке фрейма');
        },
      });
  }

  handleShowTile(tile: IViewTile): void {
    this.dialogService.showWait('Подготовка к загрузке...');
    this.framesRepository
      .fetchFrameById(tile.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.dialogService.hideWait()),
      )
      .subscribe({
        next: (frame: IFrame) => {
          if (frame && frame.file) {
            this.slidePanelService
              .showPanel$<Partial<IFrame> | null>(FCViewFramePanel, { frame })
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((result: Partial<IFrame> | null) => {
                if (result) {
                  this.framesRepository
                    .updateFrame(tile.id, result)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe();
                }
              });
          } else {
            this.dialogService.showToastError('Файл фрейма не найден');
          }
        },
        error: (err: Error) => {
          this.dialogService.showToastError(err.message || 'Ошибка при загрузке фрейма');
        },
      });
  }
}
