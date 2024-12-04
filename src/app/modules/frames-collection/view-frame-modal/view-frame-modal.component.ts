import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSliderModule } from '@angular/material/slider';
import { JSTDialogService } from '@jst/ui';

import { SMCInputTextModalComponent } from '../../../common/components';
import { FileHelper } from '../../../common/helpers';
import { IViewTile } from '../../../common/interfaces';

const DEF_SCALE = 50;
const MAX_SCALE = 800;

export interface IViewFrameModalResult {
  name?: string;
  file?: File;
  width?: number;
  height?: number;
}

@Component({
    selector: 'fc-view-frame-modal',
    imports: [MatSliderModule, FormsModule, MatButtonModule],
    templateUrl: './view-frame-modal.component.html',
    styleUrl: './view-frame-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FCViewFrameModalComponent {
  dialogRef!: MatDialogRef<FCViewFrameModalComponent>;

  scrImage: string | ArrayBuffer | null = null;

  scale = DEF_SCALE;

  title: WritableSignal<string> = signal('<не задано>');

  private tile: IViewTile | null = null;

  private modalResult: IViewFrameModalResult = {};

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly jstDialogService: JSTDialogService,
  ) {}

  @HostListener('wheel', ['$event']) onWheel(e: WheelEvent): void {
    if (e.deltaY < 0) {
      this.scale = Math.min(this.scale + 10, MAX_SCALE);
    } else {
      this.scale = Math.max(this.scale - 10, 1);
    }
  }

  get imgTransform(): string {
    return `scale(${this.scale / DEF_SCALE})`;
  }

  get hasTile(): boolean {
    return Boolean(this.tile);
  }

  get hasChanged(): boolean {
    return Object.keys(this.modalResult).length > 0;
  }

  setData(data: { tile: IViewTile }): void {
    if (data?.tile) {
      this.tile = data.tile;
      if (this.tile.file) {
        this.setVieFile(this.tile.file);
      }
      this.title.set(`${this.tile.name} (${this.tile.width}x${this.tile.height})`);
    }
  }

  onChangeFile(): void {
    FileHelper.uploadFile<File>('image/*').subscribe(async (file: File) => {
      const dimension = await FileHelper.getFileDimensions(file);
      this.setVieFile(file);
      this.modalResult.file = file;
      this.modalResult.width = dimension.width;
      this.modalResult.height = dimension.height;
    });
  }

  onChangeName(): void {
    this.jstDialogService
      .showModal<string>('Наименование фрейма', SMCInputTextModalComponent, {
        label: 'Наименование фрейма',
        applyTitle: 'Изменить',
        value: this.tile?.name,
      })
      .subscribe((value: string) => {
        if (value !== undefined) {
          this.title.set(`${value} (${this.tile?.width}x${this.tile?.height})`);
          this.modalResult.name = value;
        }
      });
  }

  onApply(): void {
    if (this.hasChanged) {
      this.dialogRef?.close(this.modalResult);
    } else {
      this.dialogRef?.close();
    }
  }

  onClose(): void {
    this.dialogRef?.close();
  }

  private setVieFile(file: File): void {
    const fr = new FileReader();
    fr.onload = () => {
      this.scrImage = fr.result;
      this.cdr.detectChanges();
    };
    fr.readAsDataURL(file);
  }
}
