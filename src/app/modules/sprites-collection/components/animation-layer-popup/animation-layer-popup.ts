import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ISelectOption, SCheckboxComponent, SInputNumberComponent, SSelectComponent } from '@selax/ui';

import { ILayerAnimationRow, ISpriteAnimationLayer, ISpriteFrame, ISpriteLayer } from '~core/interfaces';
import { EditSpriteStore } from '~core/stores';

interface IFrameOption {
  guid: string;
  name: string;
  value: number | null;
}

@Component({
  selector: 'sc-animation-layer-popup',
  templateUrl: './animation-layer-popup.html',
  styleUrl: './animation-layer-popup.scss',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ReactiveFormsModule,
    SInputNumberComponent,
    SCheckboxComponent,
    SSelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SCAnimationLayerPopup implements OnInit {
  readonly layer = input<ILayerAnimationRow | null>(null);

  readonly usedLayerGuids = input<string[]>([]);

  dialogRef!: MatDialogRef<SCAnimationLayerPopup>;

  readonly options = signal<ISelectOption[]>([]);

  readonly frames = signal<IFrameOption[]>([]);

  readonly formGroup = new FormGroup({
    layerGuid: new FormControl<string>('', Validators.required),
    loop: new FormControl<boolean>(false),
    speed: new FormControl<number>(0),
  });

  private readonly destroyRef = inject(DestroyRef);

  private readonly editSpriteStore = inject(EditSpriteStore);

  constructor() {
    effect(() => {
      const layer = this.layer();
      if (layer) {
        this.formGroup.patchValue({
          layerGuid: layer.layerGuid,
          loop: layer.loop,
          speed: layer.speed,
        });
        this.updateFrames(layer.layerGuid, layer.frames);
      }
    });
    effect(() => {
      const layers = this.editSpriteStore.layers();
      this.updateLayerOptions(layers);
    });
  }

  ngOnInit(): void {
    this.formGroup
      .get('layerGuid')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((layerGuid: string | null) => {
        this.updateFrames(layerGuid);
      });
  }

  handleSetSpeedAllFrames(isClear: boolean = false): void {
    this.frames.update((frames: IFrameOption[]) => {
      return frames.map((frame: IFrameOption) => ({
        ...frame,
        value: isClear ? null : (this.formGroup.get('speed')?.value ?? null),
      }));
    });
  }

  handleApply(): void {
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    const frames: Record<string, number | null> = {};
    this.frames().forEach((frame: IFrameOption) => {
      frames[frame.guid] = frame.value;
    });
    const data: ISpriteAnimationLayer = {
      ...(this.formGroup.getRawValue() as Omit<ISpriteAnimationLayer, 'frames'>),
      frames,
    };
    this.dialogRef?.close(data);
  }

  handleClose(): void {
    this.dialogRef?.close();
  }

  private updateLayerOptions(layers: ISpriteLayer[]): void {
    const options = layers.map((layer: ISpriteLayer) => ({
      value: layer.guid,
      title: layer.name,
      disabled: this.usedLayerGuids().includes(layer.guid) && layer.guid !== this.layer()?.layerGuid,
      data: layer.frames.map((frame: ISpriteFrame) => ({
        guid: frame.guid,
        name: frame.name,
        value: null,
      })),
    }));
    this.options.set(options);
  }

  private updateFrames(layerGuid: string | null, framesData: Record<string, number | null> | null = null): void {
    const layer = this.options().find((option: ISelectOption) => option.value === layerGuid);
    if (layer) {
      if (framesData) {
        const frames = (layer.data as IFrameOption[]).map((frame: IFrameOption) => ({
          ...frame,
          value: framesData[frame.guid] ?? null,
        }));
        this.frames.set(frames);
      } else {
        this.frames.set(layer.data as IFrameOption[]);
      }
    } else {
      this.frames.set([]);
    }
  }
}
