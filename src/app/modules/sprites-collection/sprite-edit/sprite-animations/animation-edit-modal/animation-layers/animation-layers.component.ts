import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ISpriteAnimationLayer, ISpriteLayersListItem } from '../../../../../../common/interfaces';
import { AnimationStore } from '../../../../../../stores/animation.store';
import { SCAnimationLayerItemComponent } from './animation-layer-item/animation-layer-item.component';

@Component({
    selector: 'sc-animation-layers',
    imports: [CommonModule, MatButtonModule, MatIconModule, SCAnimationLayerItemComponent],
    templateUrl: './animation-layers.component.html',
    styleUrl: './animation-layers.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SCAnimationLayersComponent {
  @Input() layersList: ISpriteLayersListItem[] = [];

  readonly layers$ = this.animationStore.layers$;

  constructor(private readonly animationStore: AnimationStore) {}

  onLayerRemove(idx: number): void {
    this.animationStore.removeLayer(idx);
  }

  onLayerChange(idx: number, layer: ISpriteAnimationLayer): void {
    this.animationStore.updateLayer({ idx, layer });
  }

  onAddLayer(): void {
    this.animationStore.addLayer();
  }
}
