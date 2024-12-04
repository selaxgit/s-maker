import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { JSTDialogService } from '@jst/ui';
import { combineLatest, take } from 'rxjs';

import { HtmlHelper } from '../../../../common/helpers';
import { ISprite, ISpriteAnimation, ISpriteLayersListItem, SpriteEditStateType } from '../../../../common/interfaces';
import { SpriteStore } from '../../../../stores';
import {
  AnimationEditModalResultType,
  IAnimationEditModalData,
  SCAnimationEditModalComponent,
} from './animation-edit-modal/animation-edit-modal.component';

@Component({
    selector: 'sc-sprite-animations',
    imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule, DragDropModule],
    templateUrl: './sprite-animations.component.html',
    styleUrl: './sprite-animations.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SCSpriteAnimationsComponent {
  @Input() projectId!: number;

  readonly animations$ = this.spriteStore.animations$;

  readonly spriteEditState$ = this.spriteStore.spriteEditState$;

  readonly animationPlaying$ = this.spriteStore.animationPlaying$;

  readonly currentAnimation$ = this.spriteStore.currentAnimation$;

  constructor(
    private readonly jstDialogService: JSTDialogService,
    private readonly spriteStore: SpriteStore,
  ) {}

  onSetAnimationPlaying(item: ISpriteAnimation, playing: boolean): void {
    this.onSelectAnimation(item);
    this.spriteStore.setAnimationPlaying({ id: item.id, playing });
  }

  onEditAnimation(e: MouseEvent, item: ISpriteAnimation): void {
    e.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.editAnimation(item);
  }

  onRemoveAnimation(e: MouseEvent, item: ISpriteAnimation): void {
    e.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.jstDialogService.showConfirm('Вы действительно хотите удалить анимацию?').subscribe((confirm: boolean) => {
      if (confirm) {
        this.spriteStore.removeAnimation(item.id);
      }
    });
  }

  onSelectAnimation(item: ISpriteAnimation): void {
    this.spriteEditState$.pipe(take(1)).subscribe((state: SpriteEditStateType) => {
      if (state === 'animations') {
        this.spriteStore.setCurrentAnimation(item);
      }
    });
  }

  onAddAnimation(): void {
    HtmlHelper.blurActiveElement();
    this.editAnimation();
  }

  private editAnimation(animation: ISpriteAnimation | null = null): void {
    combineLatest([this.spriteStore.sprite$, this.spriteStore.layers$])
      .pipe(take(1))
      .subscribe(([sprite, layersList]: [ISprite | null, ISpriteLayersListItem[]]) => {
        const title = animation ? 'Редактирование анимации' : 'Добавление анимации';
        this.jstDialogService
          .showModal<
            AnimationEditModalResultType,
            IAnimationEditModalData
          >(title, SCAnimationEditModalComponent, { layersList, sprite, animation }, false)
          .subscribe((info: AnimationEditModalResultType) => {
            if (info?.reload) {
              this.spriteStore.updateAnimations();
            }
          });
      });
  }
}
