import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { JSTDialogService } from '@jst/ui';
import { take } from 'rxjs';

import { SMCInputTextModalComponent } from '../../../../common/components';
import { ISpriteLayersListItem } from '../../../../common/interfaces';
import { SpriteStore } from '../../../../stores';
import { SerialHelpers } from '../../helpers';
import { SCSpriteLayerItemComponent } from './sprite-layer-item/sprite-layer-item.component';

@Component({
    selector: 'sc-sprite-layers',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        DragDropModule,
        SCSpriteLayerItemComponent,
    ],
    templateUrl: './sprite-layers.component.html',
    styleUrl: './sprite-layers.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SCSpriteLayersComponent {
  @Input() projectId!: number;

  @Input() spriteId!: number;

  readonly allLayerVisibledState$ = this.spriteStore.allLayerVisibledState$;

  readonly isLoading$ = this.spriteStore.isLayersLoading$;

  readonly layers$ = this.spriteStore.layers$;

  constructor(
    private readonly jstDialogService: JSTDialogService,
    private readonly spriteStore: SpriteStore,
  ) {}

  onDropLayer(event: CdkDragDrop<ISpriteLayersListItem[]>): void {
    if (event.isPointerOverContainer && event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.spriteStore.reOrderLayers(event.container.data);
    }
  }

  onAdd(): void {
    this.layers$.pipe(take(1)).subscribe((layers: ISpriteLayersListItem[]) => {
      const idx = SerialHelpers.getLayerSerialNumer(layers);
      this.jstDialogService
        .showModal<string>('Новый слой', SMCInputTextModalComponent, {
          label: 'Наименование слоя',
          applyTitle: 'Добавить слой',
          value: `Layer ${idx}`,
        })
        .subscribe((value: string) => {
          if (value !== undefined) {
            this.spriteStore.addLayer({
              projectId: this.projectId,
              name: value,
            });
          }
        });
    });
  }

  onToggleVisible(currentValue: boolean | null): void {
    this.spriteStore.setAllLayersVisible(!Boolean(currentValue));
  }
}
