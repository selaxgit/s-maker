import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { SDialogService, SSlidePanelContainerComponent, SSlidePanelExtendClass } from '@selax/ui';
import { ISUCoords, ISURect, SUCanvasHelper, SUFileHelper } from '@selax/utils';

import { SMCInputTextModal } from '~components/input-text-modal';
import { SMCToolbarButtons } from '~components/toolbar-buttons';
import { SMFileDropDirective } from '~directives/file-drop.directive';
import { AppPixiStateEnum, ZoomEnum } from '~pixijs/interfaces';

import { CutFrameApp } from './cut-frame.app';

@Component({
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    SSlidePanelContainerComponent,
    SMFileDropDirective,
    SMCToolbarButtons,
  ],
  templateUrl: './cut-single-frame.html',
  styleUrl: './cut-single-frame.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FCCutSingleFramePanel extends SSlidePanelExtendClass implements AfterViewInit, OnDestroy {
  readonly filename = signal<string | null>(null);

  readonly coordsInfo = signal<string | null>(null);

  private readonly selectedRect = signal<ISURect | null>(null);

  readonly disabledApplyButton = computed(() => this.selectedRect() === null);

  private readonly appPixiRef = viewChild.required<ElementRef<HTMLDivElement>>('appPixi');

  private readonly cutFrameApp = new CutFrameApp();

  private readonly dialogService = inject(SDialogService);

  private currentFile: File | null = null;

  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    this.initializePixi();
  }

  ngOnDestroy(): void {
    if (this.cutFrameApp) {
      this.cutFrameApp.destroy();
    }
  }

  onDropFile(files: File[]): void {
    this.setFile(files[0]);
  }

  onState(value: AppPixiStateEnum): void {
    if (this.cutFrameApp) {
      this.cutFrameApp.state = value;
    }
  }

  handleZoom(value: ZoomEnum): void {
    if (this.cutFrameApp) {
      this.cutFrameApp.setZoom(value);
    }
  }

  onChangeFile(): void {
    SUFileHelper.uploadFile<File>('image/*')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((file: File) => {
        this.setFile(file);
      });
  }

  onApply(): void {
    this.dialogService
      .showModal<string>('Создание фрейма', SMCInputTextModal, {
        label: 'Наименование фрейма',
        applyTitle: 'Добавить фрейм',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((name: string | undefined) => {
        if (name && this.currentFile && this.selectedRect()) {
          SUCanvasHelper.cropFileToFile(name, this.currentFile, this.selectedRect()!).then((file: File | null) => {
            this.closePanel(file);
          });
        }
      });
  }

  onClose(): void {
    this.closePanel(null);
  }

  private async initializePixi(): Promise<void> {
    if (this.appPixiRef()?.nativeElement) {
      await this.cutFrameApp.initialize(this.appPixiRef()!.nativeElement);
      this.cutFrameApp.state = AppPixiStateEnum.Move;
      this.cutFrameApp.onMouseMove = (coords: ISUCoords | null): void => {
        this.coordsInfo.set(coords ? `${coords.x}x${coords.y}` : 'нет');
      };
      this.cutFrameApp.onSelectedRect = (rect: ISURect | null): void => {
        this.selectedRect.set(rect);
      };
    }
  }

  private async setFile(file: File): Promise<void> {
    this.currentFile = file;
    this.filename.set(file.name);
    this.handleZoom(ZoomEnum.Default);
    await this.cutFrameApp.setFile(file);
  }
}
