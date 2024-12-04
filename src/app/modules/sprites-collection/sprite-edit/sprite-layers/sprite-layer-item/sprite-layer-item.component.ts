import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { JSTDialogService } from '@jst/ui';
import { combineLatest } from 'rxjs';

import { SMCInputTextModalComponent, SMCSelectFrameModalComponent } from '../../../../../common/components';
import { FileHelper, HtmlHelper } from '../../../../../common/helpers';
import { ISpriteFrame, ISpriteLayer, ISpriteLayersListItem, IViewTile } from '../../../../../common/interfaces';
import { SessionStorageService } from '../../../../../common/services/common';
import { SpriteStore } from '../../../../../stores';
import { SerialHelpers } from '../../../helpers';
import { SCSpriteLayerItemFrameComponent } from '../sprite-layer-item-frame/sprite-layer-item-frame.component';

const EXPAND_LAYERS_STORE_KEY = 's-marker:sc-sprite-layers:expanded-layers';

@Component({
    selector: 'sc-sprite-layer-item',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        DragDropModule,
        SCSpriteLayerItemFrameComponent,
    ],
    templateUrl: './sprite-layer-item.component.html',
    styleUrl: './sprite-layer-item.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SCSpriteLayerItemComponent implements OnInit {
  @Input() projectId!: number;

  @Input() spriteId!: number;

  @Input() layer!: ISpriteLayersListItem;

  @Input() layerName!: string;

  @Input() layerVisible = true;

  readonly expanded: WritableSignal<boolean> = signal(false);

  readonly currentLayer$ = this.spriteStore.currentLayer$;

  readonly currentFrame$ = this.spriteStore.currentFrame$;

  private currentLayerId: number | null = null;

  constructor(
    private readonly jstDialogService: JSTDialogService,
    private readonly sessionStorageService: SessionStorageService,
    private readonly spriteStore: SpriteStore,
  ) {
    combineLatest([this.currentLayer$, this.currentFrame$])
      .pipe(takeUntilDestroyed())
      .subscribe(([layer, frame]: [ISpriteLayer | null, ISpriteFrame | null]) => {
        this.currentLayerId = layer?.id ?? frame?.layerId ?? null;
        if (this.currentLayerId === this.layer?.id && !this.expanded()) {
          this.expanded.set(true);
        }
      });
  }

  @HostBinding('class.selected') get isSelected(): boolean {
    return this.currentLayerId === this.layer.id;
  }

  ngOnInit(): void {
    this.expandedStorage('load');
  }

  onSelect(): void {
    this.spriteStore.selectLayerById(this.layer.id);
  }

  onAddFrame(type: 'file' | 'collection'): void {
    switch (type) {
      case 'collection':
        this.addFrameFromCollection();
        break;
      case 'file':
        this.addFrameFromFile();
        break;
    }
  }

  onRemove(event: MouseEvent): void {
    event.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.jstDialogService
      .showConfirm('Вы действительно хотите удалить этот слой и его фреймы?', 'Удаление слоя', 'Удалить слой')
      .subscribe((confirm: boolean) => {
        if (confirm) {
          this.spriteStore.removeLayer(this.layer.id);
        }
      });
  }

  onEditName(event: MouseEvent): void {
    event.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.jstDialogService
      .showModal<string>('Изменить наименование слой', SMCInputTextModalComponent, {
        label: 'Наименование слоя',
        applyTitle: 'Изменить наименование',
        value: this.layer.name,
      })
      .subscribe((value: string) => {
        if (value !== undefined) {
          this.spriteStore.updateLayer(this.layer.id, { name: value });
        }
      });
  }

  onToggleVisible(event: MouseEvent): void {
    event.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.spriteStore.updateLayer(this.layer.id, { visible: !this.layer.visible });
  }

  onToggleExpand(event?: MouseEvent): void {
    event?.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.expandLayer(!this.expanded());
  }

  onDropFrame(event: CdkDragDrop<ISpriteFrame[]>): void {
    if (event.isPointerOverContainer && event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.spriteStore.reOrderFrames({
        layerId: this.layer.id,
        frames: event.container.data,
      });
    }
  }

  private addFrameFromCollection(): void {
    this.jstDialogService
      .showModal<
        IViewTile[],
        { projectId: number; multiple: boolean }
      >('Выбор фрейма', SMCSelectFrameModalComponent, { projectId: this.projectId, multiple: true }, true, false)
      .subscribe((frames: IViewTile[]) => {
        if (!frames) {
          return;
        }
        const idx = SerialHelpers.getFrameSerialNumer(this.layer.frames);
        this.expandLayer(true);
        this.spriteStore.addLayerFrameFromCollection({
          projectId: this.projectId,
          spriteId: this.spriteId,
          layerId: this.layer.id,
          startIdxName: idx,
          frames,
        });
      });
  }

  private addFrameFromFile(): void {
    FileHelper.uploadFile<FileList>('image/*', true).subscribe((files: FileList) => {
      const idx = SerialHelpers.getFrameSerialNumer(this.layer.frames);
      this.expandLayer(true);
      this.spriteStore.addLayerFrameFromFiles({
        projectId: this.projectId,
        spriteId: this.spriteId,
        layerId: this.layer.id,
        startIdxName: idx,
        files,
      });
    });
  }

  private expandLayer(value: boolean): void {
    if (this.expanded() !== value) {
      this.expanded.update(() => {
        this.expandedStorage('save', value);
        return value;
      });
    }
  }

  private expandedStorage(type: 'save' | 'load', value?: boolean): void {
    const key = `${EXPAND_LAYERS_STORE_KEY}:${this.projectId}:${this.spriteId}:${this.layer.id}`;
    if (type === 'load') {
      const expandLayer = this.sessionStorageService.get<boolean>(key);
      if (expandLayer) {
        this.expanded.set(true);
      }
    } else {
      this.sessionStorageService.set(key, Boolean(value));
    }
  }
}
