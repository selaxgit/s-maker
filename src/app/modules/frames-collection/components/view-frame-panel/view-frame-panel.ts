import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { SDialogService, SSlidePanelContainerComponent, SSlidePanelExtendClass } from '@selax/ui';
import { SUFileHelper } from '@selax/utils';

import { SMCInputTextModal } from '~components/input-text-modal';
import { SMCScaleButtons } from '~components/scale-buttons';
import { IFrame } from '~core/interfaces';
import { AppPixiStateEnum, ZoomEnum } from '~pixijs/interfaces';

import { ViewFrameApp } from './view-frame.app';

@Component({
  imports: [MatButtonModule, SSlidePanelContainerComponent, SMCScaleButtons],
  templateUrl: './view-frame-panel.html',
  styleUrl: './view-frame-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FCViewFramePanel extends SSlidePanelExtendClass implements OnInit, AfterViewInit, OnDestroy {
  readonly frame = input.required<IFrame>();

  title = signal<string>('<не задано>');

  isDisabledApplyButton = signal<boolean>(true);

  private readonly dialogService = inject(SDialogService);

  private panelResult: Partial<IFrame> = {};

  private readonly appPixiRef = viewChild.required<ElementRef<HTMLDivElement>>('appPixi');

  private readonly viewFrameApp = new ViewFrameApp();

  private readonly destroyRef = inject(DestroyRef);

  get hasFrame(): boolean {
    return Boolean(this.frame);
  }

  ngOnInit(): void {
    if (this.frame) {
      this.title.set(`Просмотр фрейма: ${this.frame().name} (${this.frame().width}x${this.frame().height})`);
    }
  }

  ngAfterViewInit(): void {
    this.initializePixi();
  }

  ngOnDestroy(): void {
    if (this.viewFrameApp) {
      this.viewFrameApp.destroy();
    }
  }

  handleZoom(value: ZoomEnum): void {
    if (this.viewFrameApp) {
      this.viewFrameApp.setZoom(value);
    }
  }

  handleChangeFile(): void {
    SUFileHelper.uploadFile<File>('image/*')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (file: File) => {
        const dimension = await SUFileHelper.getFileDimensions(file);
        this.panelResult.file = file;
        this.panelResult.width = dimension.width;
        this.panelResult.height = dimension.height;
        this.isDisabledApplyButton.set(false);
        this.viewFrameApp.setFile(file);
        this.handleZoom(ZoomEnum.Default);
      });
  }

  handleChangeName(): void {
    this.dialogService
      .showModal<string>('Наименование фрейма', SMCInputTextModal, {
        label: 'Наименование фрейма',
        applyTitle: 'Изменить',
        value: this.panelResult.name ?? this.frame().name,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))

      .subscribe((value?: string) => {
        if (value !== undefined && value !== this.frame().name) {
          this.title.set(`Просмотр фрейма: ${value} (${this.frame().width}x${this.frame().height})`);
          this.panelResult.name = value;
          this.isDisabledApplyButton.set(false);
        }
      });
  }

  handleApply(): void {
    if (Object.keys(this.panelResult).length > 0) {
      this.closePanel(this.panelResult);
    }
  }

  handleClose(): void {
    this.closePanel(null);
  }

  private async initializePixi(): Promise<void> {
    if (this.appPixiRef()?.nativeElement) {
      await this.viewFrameApp.initialize(this.appPixiRef()!.nativeElement);
      this.viewFrameApp.state = AppPixiStateEnum.Move;
      if (this.frame().file) {
        this.viewFrameApp.setFile(this.frame().file);
      }
    }
  }
}
