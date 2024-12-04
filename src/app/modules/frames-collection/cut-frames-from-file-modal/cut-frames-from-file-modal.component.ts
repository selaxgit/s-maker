import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { JSTCheckboxModule, JSTFormControl, JSTInputModule, JSTTouchspinModule } from '@jst/ui';
import { firstValueFrom } from 'rxjs';

import { CanvasHelper, FileHelper, HtmlHelper } from '../../../common/helpers';
import { FramesService } from '../../../common/services/frames';

const NOT_FILE_CHOICE = 'Файл не выбран';
const DEF_WIDTH_HEIHT = 32;

@Component({
    selector: 'app-cut-frames-from-file-modal',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        JSTTouchspinModule,
        JSTInputModule,
        JSTCheckboxModule,
    ],
    templateUrl: './cut-frames-from-file-modal.component.html',
    styleUrl: './cut-frames-from-file-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CutFramesFromFileModalComponent {
  dialogRef!: MatDialogRef<CutFramesFromFileModalComponent>;

  hasBgFile: WritableSignal<boolean> = signal(false);

  hasFileError: WritableSignal<boolean> = signal(false);

  loadingState: WritableSignal<boolean> = signal(false);

  formGroup = new FormGroup({
    tileWidth: new JSTFormControl(DEF_WIDTH_HEIHT, Validators.required),
    tileHeight: new JSTFormControl(DEF_WIDTH_HEIHT, Validators.required),
    frameName: new JSTFormControl('Frame', Validators.required),
    checkDuplicates: new JSTFormControl(false),
  });

  private treeId: number | null = null;

  private projectId!: number;

  private bgFile: File | null = null;

  get bgFilename(): string {
    return this.bgFile?.name ?? NOT_FILE_CHOICE;
  }

  constructor(private readonly framesService: FramesService) {}

  onChoiceBgFile(): void {
    FileHelper.uploadFile<File>('image/*').subscribe((file: File) => {
      this.bgFile = file;

      this.hasBgFile.set(true);
      this.hasFileError.set(false);
    });
  }

  onClearBgFile(): void {
    this.bgFile = null;
    this.hasBgFile.set(false);
  }

  onApply(): void {
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    if (!this.hasBgFile()) {
      this.hasFileError.set(true);
      return;
    }
    this.cutFrames();
  }

  onClose(): void {
    this.dialogRef?.close();
  }

  setData(data: { projectId: number; treeId: number | null }): void {
    this.projectId = data.projectId;
    this.treeId = data.treeId;
  }

  onCloseModal(): void {
    if (!this.loadingState()) {
      this.onClose();
    }
  }

  private async cutFrames(): Promise<void> {
    if (!this.bgFile) {
      return;
    }
    HtmlHelper.blurActiveElement();
    this.formGroup.disable();
    const tileWidth = Number(this.formGroup.get('tileWidth')?.value);
    const tileHeight = Number(this.formGroup.get('tileHeight')?.value);
    const checkDuplicates = Boolean(this.formGroup.get('checkDuplicates')?.value);
    let frameName = this.formGroup.get('frameName')?.value;
    if (isNaN(tileWidth) || isNaN(tileHeight)) {
      return;
    }
    if (!frameName) {
      frameName = 'Frame';
    }
    this.loadingState.set(true);
    const fileCanvas = await CanvasHelper.fileToCanvas(this.bgFile);
    let offsetY = 0;
    const listFiles: { deleted: boolean; name: string; file: File }[] = [];
    while (offsetY + tileHeight <= fileCanvas.height) {
      let offsetX = 0;
      while (offsetX + tileWidth <= fileCanvas.width) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          continue;
        }
        canvas.width = tileWidth;
        canvas.height = tileHeight;
        ctx.drawImage(fileCanvas, offsetX, offsetY, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
        const blob = await CanvasHelper.canvasToBlob(canvas);
        const name = `${frameName}-${offsetX}-${offsetY}`;
        const file = new File([blob], `${name}.png`);
        listFiles.push({
          name,
          file,
          deleted: false,
        });
        offsetX += tileWidth;
      }
      offsetY += tileHeight;
    }
    const dt = new DataTransfer();
    if (!checkDuplicates) {
      for (const item of listFiles) {
        dt.items.add(item.file);
      }
      await firstValueFrom(this.framesService.addFromFiles(this.projectId, this.treeId, dt.files));
    } else {
      for (let i = 0; i < listFiles.length; i++) {
        const file = listFiles[i];
        if (file.deleted) {
          continue;
        }
        for (let j = i + 1; j < listFiles.length; j++) {
          const checkFile = listFiles[j];
          if (checkFile.deleted) {
            continue;
          }
          const compare = await FileHelper.compareFiles(file.file, checkFile.file);
          if (compare) {
            checkFile.deleted = true;
          }
        }
      }
      for (const item of listFiles) {
        if (!item.deleted) {
          dt.items.add(item.file);
        }
      }
      await firstValueFrom(this.framesService.addFromFiles(this.projectId, this.treeId, dt.files));
    }
    this.dialogRef?.close(true);
  }
}
