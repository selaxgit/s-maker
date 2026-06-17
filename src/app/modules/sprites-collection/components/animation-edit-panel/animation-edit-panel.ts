import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import {
  SCheckboxComponent,
  SDialogService,
  SInputComponent,
  SInputNumberComponent,
  SSlidePanelContainerComponent,
  SSlidePanelExtendClass,
} from '@selax/ui';
import { ISUCoords, ISURect, SUStringHelper } from '@selax/utils';

import { SMCScaleButtons } from '~components/scale-buttons';
import { AdjustmentModeEnum } from '~core/constants';
import { ILayerAnimationRow, ISpriteAnimation, ISpriteAnimationLayer, ISpriteLayer } from '~core/interfaces';
import { PixiAppService } from '~core/services';
import { EditSpriteStore } from '~core/stores';
import { ZoomEnum } from '~pixijs/interfaces';

import { SpriteApp } from '../../pixi-sprite/sprite.app';
import { SCAnimationLayerPopup } from '../animation-layer-popup';

const NEW_ANIMATION = 'Новая анимация';
const NEW_ANIMATION_CODE = 'a-1';

@Component({
  selector: 'sc-animation-edit-panel',
  templateUrl: './animation-edit-panel.html',
  styleUrl: './animation-edit-panel.scss',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTableModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    SInputComponent,
    SInputNumberComponent,
    SCheckboxComponent,
    SSlidePanelContainerComponent,
    SMCScaleButtons,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SCAnimationEditPanel extends SSlidePanelExtendClass implements AfterViewInit, OnDestroy {
  readonly animation = input<ISpriteAnimation | null>(null);

  readonly panelTitle = computed(() => (this.animation() ? 'Редактирование анимации' : 'Создание новой анимации'));

  readonly formGroup = new FormGroup({
    code: new FormControl<string>(this.animation()?.code ?? NEW_ANIMATION_CODE),
    name: new FormControl<string>(this.animation()?.name ?? NEW_ANIMATION),
    default: new FormControl<boolean>(this.animation()?.default ?? false),
    groundPointX: new FormControl<number | null>(null),
    groundPointY: new FormControl<number | null>(null),
    visibleGroundPoint: new FormControl<boolean>(false),
    collisionFrameX: new FormControl<number | null>(null),
    collisionFrameY: new FormControl<number | null>(null),
    collisionFrameWidth: new FormControl<number | null>(null),
    collisionFrameHeight: new FormControl<number | null>(null),
    visibleCollisionFrame: new FormControl<boolean>(false),
  });

  readonly displayedColumns = ['layer-name', 'loop', 'speed', 'buttons'];

  readonly layersDataSource = signal<ILayerAnimationRow[]>([]);

  readonly isPreviewInitializing = signal(true);

  readonly playingState = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  private readonly dialogService = inject(SDialogService);

  private readonly editSpriteStore = inject(EditSpriteStore);

  private readonly appPixiRef = viewChild.required<ElementRef<HTMLDivElement>>('appPixi');

  private readonly pixiAppService = inject(PixiAppService);

  private readonly spriteApp = new SpriteApp(this.pixiAppService);

  constructor() {
    super();
    effect(() => {
      const animation = this.animation();
      if (animation) {
        this.formGroup.patchValue(animation);
        this.updateLayersDataSource(animation.layers);
      }
    });
    effect(() => {
      const layersDataSource = this.layersDataSource();
      if (layersDataSource && this.spriteApp.isInitialized) {
        this.spriteApp.setAnimation(this.getApplyAnimation());
      }
    });
  }

  ngAfterViewInit(): void {
    this.initializePreview();
    this.formGroup.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.spriteApp.isInitialized) {
        this.spriteApp.setAnimation(this.getApplyAnimation());
      }
    });
  }

  ngOnDestroy(): void {
    if (this.spriteApp) {
      this.spriteApp.destroy();
    }
  }

  handleZoomEvent(value: ZoomEnum): void {
    this.spriteApp.setZoom(value);
  }

  handlePlaySprite(): void {
    this.spriteApp.animationPlay();
  }

  handleStopSprite(): void {
    this.spriteApp.animationStop();
  }

  handleClearGroundPoint(): void {
    this.formGroup.patchValue({
      groundPointX: null,
      groundPointY: null,
      visibleGroundPoint: false,
    });
  }

  handleClearCollisionFrame(): void {
    this.formGroup.patchValue({
      collisionFrameX: null,
      collisionFrameY: null,
      collisionFrameWidth: null,
      collisionFrameHeight: null,
      visibleCollisionFrame: false,
    });
  }

  handleAddLayer(): void {
    this.layerEdit();
  }

  handleLayerEdit(layer: ILayerAnimationRow): void {
    this.layerEdit(layer);
  }

  handleRemoveLayer(idx: number): void {
    this.dialogService
      .showConfirm('Вы действительно хотите удалить этот слой из анимации?')
      .subscribe(async (isOk: boolean) => {
        if (isOk) {
          this.layersDataSource.update((list: ILayerAnimationRow[]) => {
            if (list.length > 0) {
              list.splice(idx, 1);
              return [...list];
            }
            return list;
          });
        }
      });
  }

  handleApply(): void {
    this.closePanel(this.getApplyAnimation());
  }

  handleClose(): void {
    this.closePanel(null);
  }

  private layerEdit(layer: ILayerAnimationRow | null = null): void {
    const title = layer ? 'Редактирование слоя' : 'Добавление слоя';
    const usedLayerGuids = this.layersDataSource().map((i: ILayerAnimationRow) => i.layerGuid);
    this.dialogService
      .showModal<ISpriteAnimationLayer>(title, SCAnimationLayerPopup, {
        layer,
        usedLayerGuids,
      })
      .subscribe((value?: ISpriteAnimationLayer) => {
        if (value) {
          this.setLayerToDataSource(layer?.layerGuid ?? null, value);
        }
      });
  }

  private setLayerToDataSource(layerGuid: string | null, layer: ISpriteAnimationLayer): void {
    this.layersDataSource.update((list: ILayerAnimationRow[]) => {
      const spriteLayers = this.editSpriteStore.layers();
      const layerInfo = spriteLayers.find((l: ISpriteLayer) => l.guid === layer.layerGuid);
      const layerRow: ILayerAnimationRow = {
        ...layer,
        layerName: layerInfo?.name ?? 'unknown',
      };
      if (list.length > 0) {
        const idx = list.findIndex((i: ILayerAnimationRow) => i.layerGuid === layerGuid);
        if (idx > -1) {
          list[idx] = layerRow;
          return [...list];
        }
        return [...list, layerRow];
      }
      return [layerRow];
    });
  }

  private updateLayersDataSource(layers: ISpriteAnimationLayer[]): void {
    const spriteLayers = this.editSpriteStore.layers();
    const dataSource = layers.map((layer: ISpriteAnimationLayer) => {
      const layerInfo = spriteLayers.find((l: ISpriteLayer) => l.guid === layer.layerGuid);
      return {
        ...layer,
        layerName: layerInfo?.name ?? 'unknown',
      };
    });
    this.layersDataSource.set(dataSource);
  }

  private async initializePreview(): Promise<void> {
    const sprite = this.editSpriteStore.sprite();
    if (sprite && this.appPixiRef()?.nativeElement) {
      this.spriteApp.centeredAfterScale = true;
      await this.spriteApp.initialize(this.appPixiRef()!.nativeElement);
      await this.spriteApp.initializeSprite(sprite);
      this.spriteApp.setAdjustmentMode(AdjustmentModeEnum.Animation);
      this.spriteApp.onPlayChanged = (playing: boolean): void => {
        this.playingState.set(playing);
      };
      this.spriteApp.setAnimation(this.getApplyAnimation());
    }
    this.isPreviewInitializing.set(false);
  }

  getCollisionFrame(): ISURect | null {
    const x = this.formGroup.get('collisionFrameX')?.value ?? null;
    const y = this.formGroup.get('collisionFrameY')?.value ?? null;
    const width = this.formGroup.get('collisionFrameWidth')?.value ?? null;
    const height = this.formGroup.get('collisionFrameHeight')?.value ?? null;
    return x === null || y === null || width === null || height === null ? null : { x, y, width, height };
  }

  private getGroundPoint(): ISUCoords | null {
    const sprite = this.editSpriteStore.sprite()!;
    const x = this.formGroup.get('groundPointX')?.value ?? sprite.groundPointX;
    const y = this.formGroup.get('groundPointY')?.value ?? sprite.groundPointY;
    return x === null || y === null ? null : { x, y };
  }

  private getApplyAnimation(): ISpriteAnimation {
    const formValues = this.formGroup.getRawValue();
    return {
      ...this.animation(),
      guid: this.animation()?.guid ?? SUStringHelper.uuidv4(),
      code: formValues.code,
      name: formValues.name,
      default: formValues.default,
      groundPoint: this.getGroundPoint(),
      visibleGroundPoint: formValues.visibleGroundPoint,
      collisionFrame: this.getCollisionFrame(),
      visibleCollisionFrame: formValues.visibleCollisionFrame,
      layers: this.layersDataSource(),
    } as ISpriteAnimation;
  }
}
