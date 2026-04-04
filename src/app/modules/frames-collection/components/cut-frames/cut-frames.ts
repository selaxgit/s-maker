import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SCheckboxComponent, SDialogService, SInputComponent, SInputNumberComponent } from '@selax/ui';
import { SUCanvasHelper, SUFileHelper } from '@selax/utils';

const DEF_WH = 32;
const NOT_FILE_CHOICE = 'Файл не выбран';

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    SInputNumberComponent,
    SInputComponent,
    SCheckboxComponent,
  ],
  templateUrl: './cut-frames.html',
  styleUrl: './cut-frames.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FCCutFrames {
  readonly formGroup = new FormGroup({
    tileWidth: new FormControl(DEF_WH, Validators.required),
    tileHeight: new FormControl(DEF_WH, Validators.required),
    frameName: new FormControl('Frame', Validators.required),
    checkDuplicates: new FormControl(false),
  });

  readonly hasBgFile = signal<boolean>(false);

  readonly isProcessingState = signal<boolean>(false);

  dialogRef!: MatDialogRef<FCCutFrames>;

  private bgFile: File | null = null;

  private readonly dialogService = inject(SDialogService);

  private readonly destroyRef = inject(DestroyRef);

  get bgFilename(): string {
    return this.bgFile?.name ?? NOT_FILE_CHOICE;
  }

  onChoiceBgFile(): void {
    SUFileHelper.uploadFile<File>('image/*')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((file: File) => {
        this.bgFile = file;
        this.hasBgFile.set(true);
      });
  }

  onClearBgFile(): void {
    this.bgFile = null;
    this.hasBgFile.set(false);
  }

  async onApply(): Promise<void> {
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    if (!this.hasBgFile()) {
      this.dialogService.showToastWarning('Выберите файл для нарезки');
      return;
    }
    this.isProcessingState.set(true);
    this.formGroup.disable();
    this.dialogRef?.close(await this.cutFrames());
  }

  onClose(): void {
    this.dialogRef?.close();
  }

  private async cutFrames(): Promise<FileList | null> {
    if (!this.bgFile) {
      return null;
    }
    const tileWidth = Number(this.formGroup.get('tileWidth')?.value);
    const tileHeight = Number(this.formGroup.get('tileHeight')?.value);
    const checkDuplicates = Boolean(this.formGroup.get('checkDuplicates')?.value);
    let frameName = this.formGroup.get('frameName')?.value;
    if (isNaN(tileWidth) || isNaN(tileHeight)) {
      return null;
    }
    if (!frameName) {
      frameName = 'Frame';
    }
    const fileCanvas = await SUCanvasHelper.fileToCanvas(this.bgFile);
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
        const blob = await SUCanvasHelper.canvasToBlob(canvas);
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
          const compare = await SUFileHelper.compareFiles(file.file, checkFile.file);
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
    }
    return dt.files;
  }
}
