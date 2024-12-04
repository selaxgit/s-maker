import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { JSTDialogService, JSTSelectFileContainerModule } from '@jst/ui';
import { firstValueFrom } from 'rxjs';

import { AppPixi } from '../../../common/classes';
import { SMCInputTextModalComponent, SMCScaleButtonsComponent } from '../../../common/components';
import { CanvasHelper, FileHelper } from '../../../common/helpers';
import { ZoomType } from '../../../common/interfaces';
import { FramesService } from '../../../common/services/frames';
import { CutFrameContainer } from './pixi/cut-frame.container';

@Component({
    selector: 'app-cut-from-file-modal',
    imports: [CommonModule, MatButtonModule, MatIconModule, JSTSelectFileContainerModule, SMCScaleButtonsComponent],
    templateUrl: './cut-from-file-modal.component.html',
    styleUrl: './cut-from-file-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CutFromFileModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('pixiContainer') pixiContainerRef!: ElementRef<HTMLDivElement>;

  dialogRef!: MatDialogRef<CutFromFileModalComponent>;

  filename: WritableSignal<string | null> = signal(null);

  private appPixi = new AppPixi();

  private cutFrameContainer = new CutFrameContainer();

  private fileCanvas: HTMLCanvasElement | null = null;

  private treeId: number | null = null;

  private projectId!: number;

  constructor(
    private readonly jstDialogService: JSTDialogService,
    private readonly framesService: FramesService,
  ) {}

  ngAfterViewInit(): void {
    this.initializePixi();
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    this.appPixi.destroy();
  }

  onZoom(zoom: ZoomType): void {
    this.appPixi.setZoom(zoom);
  }

  onSelectOtherFile(): void {
    FileHelper.uploadFile<File>('image/*').subscribe((file: File) => this.setFile(file));
  }

  onSelectFile(files: FileList): void {
    const file = files[0];
    if (file.type.startsWith('image')) {
      this.setFile(file);
    }
  }

  onApply(): void {
    if (!this.cutFrameContainer.selectedRect) {
      return;
    }
    this.jstDialogService
      .showModal<string>('Создание фрейма', SMCInputTextModalComponent, {
        label: 'Наименование фрейма',
        applyTitle: 'Добавить вырезанный фрейм',
      })
      .subscribe(async (value: string) => {
        if (value !== undefined && this.fileCanvas && this.cutFrameContainer.selectedRect) {
          const file = await CanvasHelper.cropCanvasToFile(value, this.fileCanvas, this.cutFrameContainer.selectedRect);
          if (file) {
            await firstValueFrom(this.framesService.add(this.projectId, this.treeId, file));
          }
          this.dialogRef?.close(true);
        }
      });
  }

  onClose(): void {
    this.dialogRef?.close();
  }

  setData(data: { projectId: number; treeId: number | null }): void {
    this.projectId = data.projectId;
    this.treeId = data.treeId;
  }

  private async setFile(file: File): Promise<void> {
    this.filename.set(file.name);
    this.fileCanvas = await CanvasHelper.fileToCanvas(file);
    this.cutFrameContainer.setFileCanvas(this.fileCanvas);
  }

  private initializePixi(): void {
    this.appPixi.useScale = true;
    this.appPixi.initialize(this.pixiContainerRef.nativeElement).then(() => {
      this.appPixi.attachScaleContainer(this.cutFrameContainer);
    });
  }

  private keyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Space') {
      this.appPixi.useMove = true;
      this.cutFrameContainer.useMove = true;
      if (this.pixiContainerRef?.nativeElement) {
        this.pixiContainerRef.nativeElement.style.cursor = 'move';
      }
    }
  };

  private keyUp = (e: KeyboardEvent): void => {
    if (e.code === 'Space') {
      this.appPixi.useMove = false;
      this.cutFrameContainer.useMove = false;
      if (this.pixiContainerRef?.nativeElement) {
        this.pixiContainerRef.nativeElement.style.cursor = 'default';
      }
    }
  };
}
