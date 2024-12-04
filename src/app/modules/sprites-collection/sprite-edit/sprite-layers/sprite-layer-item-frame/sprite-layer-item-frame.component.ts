import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { JSTDialogService } from '@jst/ui';

import { SMCInputTextModalComponent } from '../../../../../common/components';
import { HtmlHelper } from '../../../../../common/helpers';
import { ISpriteFrame } from '../../../../../common/interfaces';
import { SpriteStore } from '../../../../../stores';

@Component({
    selector: 'sc-sprite-layer-item-frame',
    imports: [CommonModule, MatButtonModule, MatIconModule],
    templateUrl: './sprite-layer-item-frame.component.html',
    styleUrl: './sprite-layer-item-frame.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SCSpriteLayerItemFrameComponent {
  @Input() frame!: ISpriteFrame;

  @Input() name!: string;

  @Input() visible = true;

  readonly currentFrame$ = this.spriteStore.currentFrame$;

  constructor(
    private readonly jstDialogService: JSTDialogService,
    private readonly spriteStore: SpriteStore,
  ) {}

  onSelect(): void {
    this.spriteStore.selectFrameById(this.frame.id);
  }

  onToggleVisible(event: MouseEvent): void {
    event.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.spriteStore.updateFrame({
      id: this.frame.id,
      layerId: this.frame.layerId,
      frame: { visible: !this.frame.visible },
    });
  }

  onRemoveFrame(event: MouseEvent): void {
    event.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.jstDialogService
      .showConfirm('Вы действительно хотите удалить этот фрейм?', 'Удаление фрейма', 'Удалить фрейм')
      .subscribe((confirm: boolean) => {
        if (confirm) {
          this.spriteStore.removeFrame({ id: this.frame.id, layerId: this.frame.layerId });
        }
      });
  }

  onEditName(event: MouseEvent): void {
    event.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.jstDialogService
      .showModal<string>('Изменить наименование фрейма', SMCInputTextModalComponent, {
        label: 'Наименование фрейма',
        applyTitle: 'Изменить наименование',
        value: this.frame.name,
      })
      .subscribe((value: string) => {
        if (value !== undefined) {
          this.spriteStore.updateFrame({
            id: this.frame.id,
            layerId: this.frame.layerId,
            frame: { name: value },
          });
        }
      });
  }
}
