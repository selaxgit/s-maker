import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SDialogService } from '@selax/ui';

import { SMCInputTextModal } from '~components/input-text-modal';
import { ISpriteLayer } from '~core/interfaces';
import { EditSpriteStore } from '~core/stores';
import { SerialHelper } from '~helpers/serial.helper';

import { SCSpriteLayerItem } from './components/sprite-layer-item';

@Component({
  selector: 'sc-sprite-layers',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, DragDropModule, SCSpriteLayerItem],
  templateUrl: './sprite-layers.html',
  styleUrl: './sprite-layers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SCSpriteLayers {
  readonly visibleAll = signal<boolean>(true);

  readonly dimesionFrames = signal<string>('-');

  readonly expandedLayers = signal<boolean>(false);

  readonly editSpriteStore = inject(EditSpriteStore);

  private readonly destroyRef = inject(DestroyRef);

  private readonly dialogService = inject(SDialogService);

  constructor() {
    effect(() => {
      const layers = this.editSpriteStore.layers();
      if (layers.length === 0) {
        this.dimesionFrames.set('-');
      } else {
        let width = 0;
        let height = 0;
        for (const layer of layers) {
          for (const frame of layer.frames) {
            if (frame.width > width) {
              width = frame.width;
            }
            if (frame.height > height) {
              height = frame.height;
            }
          }
        }
        this.dimesionFrames.set(`${width}x${height}`);
      }
    });
  }

  handleToggleExpandedLayers(): void {
    this.expandedLayers.set(!this.expandedLayers());
  }

  handleDropLayer(event: CdkDragDrop<ISpriteLayer[]>): void {
    if (event.isPointerOverContainer && event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.editSpriteStore.updateLayersList(event.container.data);
    }
  }

  toggleLayersVisibility(): void {
    const visibleAll = this.visibleAll();
    this.editSpriteStore.updateAllLayers({ visible: !visibleAll });
    this.visibleAll.set(!visibleAll);
  }

  handleAddLayer(): void {
    const idx = SerialHelper.getLayerSerialNumer(this.editSpriteStore.layers());
    this.dialogService
      .showModal<string>('Новый слой', SMCInputTextModal, {
        label: 'Наименование слоя',
        applyTitle: 'Добавить слой',
        value: `Layer ${idx}`,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value?: string) => {
        if (value) {
          this.editSpriteStore.addLayer({ name: value });
        }
      });
  }
}
