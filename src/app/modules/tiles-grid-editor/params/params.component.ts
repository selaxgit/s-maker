/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { JSTFileHelper, JSTFormControl, JSTInputModule, JSTTouchspinModule } from '@jst/ui';
import { finalize } from 'rxjs';

import { ITilesGrid, ITilesGridBg } from '../../../common/interfaces';
import { TilesGridStore } from '../../../stores';

@Component({
    selector: 'tge-params',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatSliderModule,
        JSTInputModule,
        JSTTouchspinModule,
    ],
    templateUrl: './params.component.html',
    styleUrl: './params.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TGEParamsComponent {
  dialogRef!: MatDialogRef<TGEParamsComponent>;

  isProcessing: WritableSignal<boolean> = signal(false);

  applyButtonTitle = 'Применить';

  formGroup = new FormGroup({
    name: new JSTFormControl(null, Validators.required),
    mapWidth: new JSTFormControl(10, Validators.required),
    mapHeight: new JSTFormControl(10, Validators.required),
    tileWidth: new JSTFormControl(32, Validators.required),
    tileHeight: new JSTFormControl(32, Validators.required),
    bgOpacity: new JSTFormControl(0.6),
  });

  private projectId: number | null = null;

  private tileGrid: ITilesGrid | null = null;

  private tileGridBg: ITilesGridBg | null = null;

  private bgFile: File | null = null;

  private bgId: number | null = null;

  constructor(private readonly tilesGridStore: TilesGridStore) {}

  get bgValue(): string {
    return this.bgFile?.name ?? 'Подложки нет';
  }

  get hasBgFile(): boolean {
    return Boolean(this.bgFile);
  }

  onApply(): void {
    if (this.formGroup.valid && this.projectId) {
      this.isProcessing.set(true);
      const params: Partial<ITilesGrid> = {
        name: String(this.formGroup.value.name),
        tileInfo: {
          width: Number(this.formGroup.value.tileWidth),
          height: Number(this.formGroup.value.tileHeight),
        },
      };
      if (this.tileGridBg?.id) {
      } else {
        params.mapInfo = {
          width: Number(this.formGroup.value.mapWidth),
          height: Number(this.formGroup.value.mapHeight),
        };
        params.items = [];
      }

      const paramsBg: Partial<ITilesGridBg> = {
        opacity: this.formGroup.get('bgOpacity')?.value ?? 0.6,
        file: this.bgFile as File,
      };

      this.tilesGridStore
        .saveTileGrid(this.projectId, this.tileGrid?.id ?? null, params, this.tileGridBg?.id ?? null, paramsBg)
        .pipe(finalize(() => this.isProcessing.set(false)))
        .subscribe({
          next: (grid: ITilesGrid) => {
            this.dialogRef?.close(grid);
          },
        });
    }
  }

  onChoiceBgFile(): void {
    JSTFileHelper.uploadFile('image/*').subscribe((response: File | FileList) => {
      this.bgFile = response as File;
      this.formGroup.get('bgOpacity')?.enable();
    });
  }

  onClearBgFile(): void {
    this.bgFile = null;
    this.formGroup.get('bgOpacity')?.disable();
  }

  setData(data: { projectId: number; tilesGrid?: ITilesGrid; tilesGridBg?: ITilesGridBg }): void {
    this.projectId = data.projectId ?? null;
    this.applyButtonTitle = data.tilesGrid ? 'Применить' : 'Создать сетку';
    this.tileGrid = data.tilesGrid ?? null;
    this.tileGridBg = data.tilesGridBg ?? null;
    if (this.tileGrid) {
      this.formGroup.get('name')?.setValue(this.tileGrid.name);
      this.formGroup.get('mapWidth')?.setValue(this.tileGrid.mapInfo?.width);
      this.formGroup.get('mapHeight')?.setValue(this.tileGrid.mapInfo?.height);
      this.formGroup.get('tileWidth')?.setValue(this.tileGrid.tileInfo?.width);
      this.formGroup.get('tileHeight')?.setValue(this.tileGrid.tileInfo?.height);
      setTimeout(() => {
        this.formGroup.get('mapWidth')?.disable();
        this.formGroup.get('mapHeight')?.disable();
      });
    }
    if (!this.tileGridBg) {
      this.formGroup.get('bgOpacity')?.disable();
    } else {
      this.bgId = this.tileGridBg.id;
      this.bgFile = this.tileGridBg.file;
      this.formGroup.get('bgOpacity')?.setValue(this.tileGridBg.opacity);
      this.formGroup.get('bgOpacity')?.enable();
    }
  }

  onClose(): void {
    this.dialogRef?.close();
  }
}
