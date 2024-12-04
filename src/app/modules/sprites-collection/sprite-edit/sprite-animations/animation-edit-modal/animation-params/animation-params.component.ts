import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { JSTCheckboxModule, JSTInputModule, JSTTouchspinModule } from '@jst/ui';

import { ICoords, IRect } from '../../../../../../common/interfaces';
import { AnimationState, AnimationStore } from '../../../../../../stores/animation.store';

@Component({
    selector: 'sc-animation-params',
    imports: [CommonModule, JSTInputModule, JSTCheckboxModule, JSTTouchspinModule],
    templateUrl: './animation-params.component.html',
    styleUrl: './animation-params.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SCAnimationParamsComponent {
  readonly animation$ = this.animationStore.animation$;

  constructor(private readonly animationStore: AnimationStore) {}

  onChangeCollisionFrame(property: keyof IRect, value: number): void {
    this.animationStore.updateCollisionFrame({ [property]: value });
  }

  onChangeGroundPoint(property: keyof ICoords, value: number): void {
    this.animationStore.updateGroundPoint({ [property]: value });
  }

  onChangeAnimation(property: keyof AnimationState, value: number | boolean | string): void {
    this.animationStore.updateAnimation({ [property]: value });
  }
}
