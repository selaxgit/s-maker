import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ISpriteAnimationLayer, ISpriteFrame, ISpriteLayersListItem } from '../../../../../../../common/interfaces';
import { SCInlineNumberInputComponent } from './inline-number-input/inline-number-input.component';

@Component({
    selector: 'sc-animation-layer-item',
    imports: [CommonModule, MatButtonModule, MatIconModule, FormsModule, SCInlineNumberInputComponent],
    templateUrl: './animation-layer-item.component.html',
    styleUrl: './animation-layer-item.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SCAnimationLayerItemComponent {
  @Input() set layer(value: ISpriteAnimationLayer) {
    this.layerInfo.set(value);
  }

  @Input() layersList: ISpriteLayersListItem[] = [];

  @Output() layerChangeEvent = new EventEmitter<ISpriteAnimationLayer>();

  @Output() layerRemoveEvent = new EventEmitter<void>();

  visibleFrames: WritableSignal<boolean> = signal(false);

  layerInfo: WritableSignal<ISpriteAnimationLayer> = signal({
    layerId: null,
    loop: false,
    speed: 1,
    frames: [],
  });

  get layerId(): number | null {
    return this.layerInfo().layerId;
  }

  set layerId(val: number | null) {
    this.layerInfo.update((layer: ISpriteAnimationLayer) => {
      const findlayer = this.layersList.find((l: ISpriteLayersListItem) => l.id === Number(val));
      return {
        ...layer,
        layerId: val !== null ? Number(val) : null,
        frames: (findlayer?.frames || []).map((f: ISpriteFrame) => ({
          id: f.id,
          name: f.name,
          speed: null,
        })),
      };
    });
    this.layerChangeEvent.emit(this.layerInfo());
  }

  get speed(): number {
    return this.layerInfo().speed;
  }

  set speed(val: number) {
    this.layerInfo.update((layer: ISpriteAnimationLayer) => ({
      ...layer,
      speed: val,
    }));
    this.layerChangeEvent.emit(this.layerInfo());
  }

  onChangeFrame(): void {
    this.layerChangeEvent.emit(this.layerInfo());
  }

  toggleVisibleFrames(): void {
    this.visibleFrames.update((value: boolean) => !value);
  }

  onRemove(): void {
    this.layerRemoveEvent.emit();
  }

  onToggleLoop(): void {
    this.layerInfo.update((layer: ISpriteAnimationLayer) => ({
      ...layer,
      loop: !layer.loop,
    }));
    this.layerChangeEvent.emit(this.layerInfo());
  }
}
