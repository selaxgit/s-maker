import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';

import { ISprite, ISpriteAnimation, ISpriteLayersListItem } from '../../../../../common/interfaces';
import { AnimationState, AnimationStore } from '../../../../../stores/animation.store';
import { SCAnimationLayersComponent } from './animation-layers/animation-layers.component';
import { SCAnimationParamsComponent } from './animation-params/animation-params.component';
import { SCAnimationPreviewComponent } from './animation-preview/animation-preview.component';

export interface IAnimationEditModalData {
  sprite: ISprite | null;
  layersList: ISpriteLayersListItem[];
  animation: ISpriteAnimation | null;
}

export type AnimationEditModalResultType = { reload: boolean } | undefined;

@Component({
    selector: 'sc-animation-edit-modal',
    imports: [
        CommonModule,
        MatButtonModule,
        SCAnimationParamsComponent,
        SCAnimationLayersComponent,
        SCAnimationPreviewComponent,
    ],
    providers: [AnimationStore],
    templateUrl: './animation-edit-modal.component.html',
    styleUrl: './animation-edit-modal.component.scss'
})
export class SCAnimationEditModalComponent {
  dialogRef!: MatDialogRef<SCAnimationEditModalComponent>;

  applyTile = 'Добавить анимацию';

  layersList: ISpriteLayersListItem[] = [];

  sprite: ISprite | null = null;

  private canSave = false;

  constructor(private readonly animationStore: AnimationStore) {
    this.animationStore.animation$.pipe(takeUntilDestroyed()).subscribe((animationState: AnimationState) => {
      this.canSave = Boolean(animationState.name);
    });
  }

  setData(data: IAnimationEditModalData): void {
    this.sprite = data.sprite ?? null;
    this.layersList = data.layersList || [];
    setTimeout(() => {
      if (data.animation) {
        this.applyTile = 'Сохранить анимацию';
        this.animationStore.initialize(data.animation);
      }
    }, 100);
  }

  onApply(): void {
    if (this.canSave && this.sprite) {
      this.animationStore
        .saveAnimation(this.sprite.projectId, this.sprite.id)
        .subscribe((animation: ISpriteAnimation | null) => {
          if (animation !== null) {
            this.dialogRef?.close({ reload: true });
          }
        });
    }
  }

  onClose(): void {
    this.dialogRef?.close();
  }
}
