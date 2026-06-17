import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SDialogService, SSlidePanelService } from '@selax/ui';

import { AdjustmentModeEnum } from '~core/constants';
import { ISpriteAnimation } from '~core/interfaces';
import { EditSpriteStore } from '~core/stores';

import { SCAnimationEditPanel } from '../animation-edit-panel';

@Component({
  selector: 'sc-sprite-animations',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './sprite-animations.html',
  styleUrl: './sprite-animations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SCSpriteAnimations {
  readonly editSpriteStore = inject(EditSpriteStore);

  readonly adjustmentModeEnum = AdjustmentModeEnum;

  readonly sectionTitle = computed(() => {
    const adjustmentMode = this.editSpriteStore.adjustmentMode();
    return adjustmentMode === AdjustmentModeEnum.Animation ? 'Анимация для просмотра' : 'Анимация';
  });

  private readonly destroyRef = inject(DestroyRef);

  private readonly dialogService = inject(SDialogService);

  private readonly slidePanelService = inject(SSlidePanelService);

  handleAddAnimation(): void {
    this.editAnimation();
  }

  handleEditAnimation(animation: ISpriteAnimation): void {
    this.editAnimation(animation);
  }

  handleRemoveAnimation(animation: ISpriteAnimation): void {
    this.dialogService
      .showConfirm('Вы действительно хотите удалить эту анимацию?', 'Удаление анимации', 'Удалить анимацию')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isOk: boolean) => {
        if (isOk) {
          this.editSpriteStore.removeAnimation(animation.guid);
        }
      });
  }

  private editAnimation(animation?: ISpriteAnimation): void {
    this.slidePanelService
      .showPanel$<ISpriteAnimation | null>(
        SCAnimationEditPanel,
        {
          animation: animation ?? null,
        },
        { disabledClose: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((editedAnimation?: ISpriteAnimation | null) => {
        if (editedAnimation) {
          this.editSpriteStore.setAnimation(editedAnimation);
        }
      });
  }
}
