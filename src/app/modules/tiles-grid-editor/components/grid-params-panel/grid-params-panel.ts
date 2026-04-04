/* eslint-disable @typescript-eslint/no-magic-numbers */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  SInputComponent,
  SInputNumberComponent,
  SSlidePanelContainerComponent,
  SSlidePanelExtendClass,
} from '@selax/ui';
import { SUFileHelper } from '@selax/utils';

import { ITilesGridParams } from '~core/interfaces';

export interface ITGEGridParamsPanelResult {
  name: string;
  gridParams: ITilesGridParams;
}

@Component({
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatTooltipModule,
    ReactiveFormsModule,
    SSlidePanelContainerComponent,
    SInputComponent,
    SInputNumberComponent,
  ],
  templateUrl: './grid-params-panel.html',
  styleUrl: './grid-params-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TGEGridParamsPanel extends SSlidePanelExtendClass implements AfterViewInit {
  readonly gridName = input.required<string>();

  readonly gridParams = input.required<ITilesGridParams>();

  readonly bgFile = signal<File | null>(null);

  readonly bgFilename = computed(() => this.bgFile()?.name ?? 'Подложки нет');

  private readonly gridNameRef = viewChild.required<SInputComponent>('gridName');

  readonly formGroup = new FormGroup({
    name: new FormControl<string>('', Validators.required),
    mapWidth: new FormControl<number>(10, Validators.required),
    mapHeight: new FormControl<number>(10, Validators.required),
    tileWidth: new FormControl<number>(32, Validators.required),
    tileHeight: new FormControl<number>(32, Validators.required),
    bgOpacity: new FormControl<number>({ value: 0.5, disabled: true }),
  });

  constructor() {
    super();
    effect(() => {
      const gridName = this.gridName();
      this.formGroup.controls.name.setValue(gridName, { emitEvent: false });
    });
    effect(() => {
      const params = this.gridParams();
      if (params) {
        this.formGroup.patchValue({ ...params }, { emitEvent: false });
      }
      this.bgFile.set(params?.bgFile ?? null);
    });
    effect(() => {
      const hasBg = !!this.bgFile();
      const opacityControl = this.formGroup.controls.bgOpacity;
      if (hasBg) {
        opacityControl.enable({ emitEvent: false });
      } else {
        opacityControl.disable({ emitEvent: false });
      }
    });
  }

  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    this.gridNameRef().focus();
  }

  handleDownloadBgFile(): void {
    const file = this.bgFile();
    if (file) {
      SUFileHelper.downloadBlob(file.name, file);
    }
  }

  handleChoiceBgFile(): void {
    SUFileHelper.uploadFile<File>('image/*')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((file: File) => {
        this.bgFile.set(file);
      });
  }

  handleApply(): void {
    if (!this.hasChanged()) {
      this.closePanel(null);
      return;
    }
    const formValue = this.formGroup.getRawValue();
    this.closePanel({
      name: formValue.name,
      gridParams: {
        mapWidth: formValue.mapWidth,
        mapHeight: formValue.mapHeight,
        tileWidth: formValue.tileWidth,
        tileHeight: formValue.tileHeight,
        bgOpacity: formValue.bgOpacity,
        bgFile: this.bgFile(),
      },
    } as ITGEGridParamsPanelResult);
  }

  handleClose(): void {
    this.closePanel(null);
  }

  private hasChanged(): boolean {
    const params = this.gridParams();
    const formValue = this.formGroup.getRawValue();
    return (
      formValue.name !== this.gridName() ||
      formValue.mapWidth !== params.mapWidth ||
      formValue.mapHeight !== params.mapHeight ||
      formValue.tileWidth !== params.tileWidth ||
      formValue.tileHeight !== params.tileHeight ||
      formValue.bgOpacity !== params.bgOpacity ||
      this.bgFile() !== params.bgFile
    );
  }
}
