import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SDialogService, SSlidePanelService } from '@selax/ui';
import { SUFileHelper, SUStringHelper } from '@selax/utils';
import { lastValueFrom } from 'rxjs';

import { SMCChoiceFramesPanel } from '~components/choice-frames-panel';
import { SMCInputTextModal } from '~components/input-text-modal';
import { EditSpriteFacade } from '~core/facade';
import { ISpriteFrame, ISpriteLayer, IViewTile } from '~core/interfaces';
import { EditSpriteStore } from '~core/stores';
import { SerialHelper } from '~helpers/serial.helper';

import { SCSpriteFrameItem } from '../sprite-frame-item';

@Component({
  selector: 'sc-sprite-layer-item',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, DragDropModule, SCSpriteFrameItem],
  templateUrl: './sprite-layer-item.html',
  styleUrl: './sprite-layer-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.selected]': 'editSpriteStore.currentLayer()?.guid === layer().guid',
  },
})
export class SCSpriteLayerItem {
  readonly layer = input.required<ISpriteLayer>();

  readonly expandedLayer = input<boolean>(false);

  readonly editSpriteStore = inject(EditSpriteStore);

  readonly visibleAccordionFrames = signal<boolean>(false);

  private readonly destroyRef = inject(DestroyRef);

  private readonly dialogService = inject(SDialogService);

  private readonly slidePanelService = inject(SSlidePanelService);

  private readonly editSpriteFacade = inject(EditSpriteFacade);

  constructor() {
    effect(() => {
      this.visibleAccordionFrames.set(this.expandedLayer());
    });
  }

  handleDropFrame(event: CdkDragDrop<ISpriteFrame[]>): void {
    if (event.isPointerOverContainer && event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.editSpriteStore.updateLayerFramesList(this.layer().guid, event.container.data);
    }
  }

  handleToggleAccordionFrames(): void {
    this.visibleAccordionFrames.set(!this.visibleAccordionFrames());
  }

  handleSelectLayer(): void {
    this.editSpriteStore.setCurrentLayer(this.layer());
  }

  handleEditLayer(): void {
    this.dialogService
      .showModal<string>('Редактировать слой', SMCInputTextModal, {
        label: 'Наименование слоя',
        applyTitle: 'Сохранить изменения',
        value: this.layer().name,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value?: string) => {
        if (value) {
          this.editSpriteStore.updateLayer(this.layer().guid, { name: value });
        }
      });
  }

  handleRemoveLayer(): void {
    this.dialogService
      .showConfirm('Вы действительно хотите удалить этот слой и его фреймы?', 'Удаление слоя', 'Удалить слой')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isOk: boolean) => {
        if (isOk) {
          this.editSpriteStore.removeLayer(this.layer().guid);
        }
      });
  }

  handleToggleVisibleLayer(): void {
    this.editSpriteStore.updateLayer(this.layer().guid, { visible: !this.layer().visible });
  }

  handleAddFrames(type: 'file' | 'collection'): void {
    switch (type) {
      case 'file':
        this.uploadFramesFromFile();
        break;
      case 'collection':
        this.showFramesCollectionPanel();
        break;
    }
  }

  private showFramesCollectionPanel(): void {
    this.slidePanelService
      .showPanel$<IViewTile[] | null>(
        SMCChoiceFramesPanel,
        {
          panelTitle: 'Выберите фреймы для слоя',
          multiple: true,
        },
        { disabledClose: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tiles: IViewTile[] | null) => {
        if (tiles) {
          this.addFramesFromCollection(tiles);
        }
      });
  }

  private addFramesFromCollection(tiles: IViewTile[]): void {
    let idx = SerialHelper.getFrameSerialNumer(this.layer().frames);
    this.dialogService.showWait('Добавление фреймов...');
    for (const tile of tiles) {
      this.editSpriteStore.addFrameToLayer(this.layer().guid, {
        guid: SUStringHelper.uuidv4(),
        frameId: tile.id,
        name: `Frame ${idx}`,
        x: 0,
        y: 0,
        width: tile.fileWidth,
        height: tile.fileHeight,
        visible: true,
        zIndex: 0,
      });
      idx++;
    }
    this.dialogService.hideWait();
    this.visibleAccordionFrames.set(true);
  }

  private uploadFramesFromFile(): void {
    SUFileHelper.uploadFile<FileList>('image/*', true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((files: FileList) => this.addFramesFromFileList(files));
  }

  private async addFramesFromFileList(files: FileList): Promise<void> {
    let idx = SerialHelper.getFrameSerialNumer(this.layer().frames);
    this.dialogService.showWait('Добавление фреймов...');
    for (const file of files) {
      await lastValueFrom(
        this.editSpriteFacade
          .addFrameToLayerFromFile(this.layer().guid, file, `Frame ${idx}`)
          .pipe(takeUntilDestroyed(this.destroyRef)),
      );
      idx++;
    }
    this.dialogService.hideWait();
    this.visibleAccordionFrames.set(true);
  }
}
