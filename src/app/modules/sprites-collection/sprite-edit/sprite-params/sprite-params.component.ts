import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { JSTCheckboxModule, JSTColorPickerModule, JSTTouchspinModule } from '@jst/ui';

import { ISprite, ISpriteFrame, ISpriteLayer } from '../../../../common/interfaces';
import { SpriteStore } from '../../../../stores';

@Component({
    selector: 'sc-sprite-params',
    imports: [CommonModule, JSTTouchspinModule, JSTColorPickerModule, JSTCheckboxModule],
    templateUrl: './sprite-params.component.html',
    styleUrl: './sprite-params.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SCSpriteParamsComponent {
  readonly sprite$ = this.spriteStore.sprite$;

  readonly currentLayer$ = this.spriteStore.currentLayer$;

  readonly currentFrame$ = this.spriteStore.currentFrame$;

  constructor(private readonly spriteStore: SpriteStore) {}

  onChangeSprite(property: keyof ISprite, value: number | boolean | string): void {
    this.spriteStore.updateSprite({ [property]: value });
  }

  onChangeLayer(id: number, property: keyof ISpriteLayer, value: number | boolean | string): void {
    this.spriteStore.updateLayer(id, { [property]: value });
  }

  onChangeFrame(layerId: number, id: number, property: keyof ISpriteFrame, value: number | boolean): void {
    this.spriteStore.updateFrame({ id, layerId, frame: { [property]: value } });
  }
}
