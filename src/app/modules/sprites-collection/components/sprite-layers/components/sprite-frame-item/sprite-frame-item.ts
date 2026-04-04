import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SDialogService } from '@selax/ui';

import { SMCInputTextModal } from '~components/input-text-modal';
import { ISpriteFrame, ISpriteLayer } from '~core/interfaces';
import { EditSpriteStore } from '~core/stores';

@Component({
  selector: 'sc-sprite-frame-item',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './sprite-frame-item.html',
  styleUrl: './sprite-frame-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SCSpriteFrameItem {
  readonly frame = input.required<ISpriteFrame>();

  readonly layer = input.required<ISpriteLayer>();

  readonly editSpriteStore = inject(EditSpriteStore);

  private readonly destroyRef = inject(DestroyRef);

  private readonly dialogService = inject(SDialogService);

  handleSelectFrame(): void {
    this.editSpriteStore.setCurrentLayer(this.layer());
    this.editSpriteStore.setCurrentFrame(this.frame());
  }

  handleEditFrame(): void {
    this.dialogService
      .showModal<string>('Редактировать фрейм', SMCInputTextModal, {
        label: 'Наименование фрейма',
        applyTitle: 'Сохранить изменения',
        value: this.frame().name,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value?: string) => {
        if (value) {
          this.editSpriteStore.updateFrame(this.layer().guid, this.frame().guid, { name: value });
        }
      });
  }

  handleRemoveFrame(): void {
    this.dialogService
      .showConfirm('Вы действительно хотите удалить этот фрейм?', 'Удаление фрейма', 'Удалить фрейм')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isOk: boolean) => {
        if (isOk) {
          this.editSpriteStore.removeFrame(this.layer().guid, this.frame().guid);
        }
      });
  }

  handleToggleVisibleFrame(): void {
    this.editSpriteStore.updateFrame(this.layer().guid, this.frame().guid, { visible: !this.frame().visible });
  }
}
