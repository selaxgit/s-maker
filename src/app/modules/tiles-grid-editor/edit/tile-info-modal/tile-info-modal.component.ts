import { CommonModule } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';

import { SMCPropertiesContainerComponent } from '../../../../common/components';
import { ICoords, IProperties, ITilesGridItem, IViewTile } from '../../../../common/interfaces';

interface IFrameInfo {
  name: string;
  width: number;
  height: number;
  src: string;
}

export interface ITileInfoResultModal {
  coords: ICoords | null;
  referenceId: number | null;
  props: IProperties;
}

@Component({
    selector: 'tge-tile-info-modal',
    imports: [CommonModule, MatButtonModule, SMCPropertiesContainerComponent],
    templateUrl: './tile-info-modal.component.html',
    styleUrl: './tile-info-modal.component.scss'
})
export class TGETileInfoModalComponent {
  dialogRef!: MatDialogRef<TGETileInfoModalComponent>;

  frameInfo: WritableSignal<IFrameInfo | null> = signal(null);

  properties: WritableSignal<IProperties> = signal({});

  private tileCoords: ICoords | null = null;

  private tileReferenceId: number | null = null;

  private tileProps: IProperties = {};

  onApply(): void {
    this.dialogRef?.close({
      coords: this.tileCoords,
      referenceId: this.tileReferenceId,
      props: this.tileProps,
    });
  }

  onChangeProperties(props: IProperties): void {
    this.tileProps = props;
  }

  onDownloadFrame(frame: IFrameInfo | null): void {
    if (frame) {
      const objectURL = frame.src;
      const link = document.createElement('a');
      link.setAttribute('href', objectURL);
      link.setAttribute('download', `${frame.name}.png`);
      link.click();
    }
  }

  setData(data: { tile: ITilesGridItem; frame: IViewTile }): void {
    this.tileCoords = data.tile ? { x: data.tile.x, y: data.tile.y } : null;
    this.tileReferenceId = data.tile ? data.tile.referenceId : null;
    this.properties.set(data?.tile?.properties ?? {});
    if (data?.frame && data.frame.file) {
      this.frameInfo.set({
        name: data.frame.name,
        width: data.frame.width,
        height: data.frame.height,
        src: URL.createObjectURL(data.frame.file),
      });
    }
  }

  onClose(): void {
    this.dialogRef?.close();
  }
}
