import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SMCScaleButtons } from '~components/scale-buttons';
import { AdjustmentModeEnum } from '~core/constants';
import {
  IEditSpriteGroundPoint,
  IEditSpriteParams,
  ISpriteAnimation,
  ISpriteAnimationLayer,
  ISpriteFrame,
  ISpriteLayer,
} from '~core/interfaces';
import { PixiAppService } from '~core/services';
import { EditSpriteStore } from '~core/stores';
import { IAnimationFrameChange, ZoomEnum } from '~pixijs/interfaces';

import { SpriteApp } from '../../pixi-sprite/sprite.app';

interface IFramesAnimationInfo extends IAnimationFrameChange {
  layerName: string;
}

@Component({
  selector: 'sc-sprite-adjustment',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatButtonToggleModule, SMCScaleButtons],
  templateUrl: './sprite-adjustment.html',
  styleUrl: './sprite-adjustment.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SCSpriteAdjustment implements AfterViewInit, OnDestroy {
  readonly editSpriteStore = inject(EditSpriteStore);

  readonly isInitializing = signal(true);

  readonly spritePlayingState = signal(false);

  readonly framesAnimationInfo = signal<IFramesAnimationInfo[]>([]);

  readonly adjustmentModeEnum = AdjustmentModeEnum;

  private readonly appPixiRef = viewChild.required<ElementRef<HTMLDivElement>>('appPixi');

  private readonly pixiAppService = inject(PixiAppService);

  private readonly spriteApp = new SpriteApp(this.pixiAppService);

  constructor() {
    effect(() => this.updateSpriteLayer(this.editSpriteStore.currentLayer()));
    effect(() => this.updateSpriteFrame(this.editSpriteStore.currentFrame()));
    effect(() => this.updateSpriteLayersList(this.editSpriteStore.layers()));
    effect(() => this.updateSpriteParams(this.editSpriteStore.params()));
    effect(() => this.updateSpriteGroundPoint(this.editSpriteStore.groundPoint()));
    effect(() => this.updateAdjustmentMode(this.editSpriteStore.adjustmentMode()));
    effect(() => this.updatePreviewAnimation(this.editSpriteStore.previewAnimation()));
  }

  ngAfterViewInit(): void {
    this.initializePixi();
  }

  ngOnDestroy(): void {
    if (this.spriteApp) {
      this.spriteApp.destroy();
    }
  }

  handleSetCurrentFrame(layerGuid: string, frame: number): void {
    if (this.spriteApp.isInitialized) {
      this.spriteApp.gotoAnimationFrame(layerGuid, frame - 1);
    }
  }

  handlePlaySprite(play: boolean): void {
    if (this.spriteApp.isInitialized) {
      if (play) {
        this.spriteApp.animationPlay();
      } else {
        this.spriteApp.animationStop();
      }
    }
  }

  handleZoom(value: ZoomEnum): void {
    if (this.spriteApp.isInitialized) {
      this.spriteApp.setZoom(value);
    }
  }

  private updateSpriteLayersList(layers: ISpriteLayer[] | null): void {
    if (this.spriteApp.isInitialized) {
      this.spriteApp.updateSpriteLayersList(layers ?? []);
    }
  }

  private updateSpriteFrame(frame: ISpriteFrame | null): void {
    if (this.spriteApp.isInitialized) {
      this.spriteApp.updateSpriteFrame(frame, this.editSpriteStore.currentLayer());
    }
  }

  private updateSpriteLayer(layer: ISpriteLayer | null): void {
    if (this.spriteApp.isInitialized) {
      this.spriteApp.updateSpriteLayer(layer);
    }
  }

  private updateSpriteParams(params: IEditSpriteParams | null): void {
    if (this.spriteApp.isInitialized) {
      this.spriteApp.updateSpriteParams(params);
    }
  }

  private updateSpriteGroundPoint(groundPoint: IEditSpriteGroundPoint | null): void {
    if (this.spriteApp.isInitialized) {
      this.spriteApp.updateSpriteGroundPoint(groundPoint);
    }
  }

  private updateAdjustmentMode(mode: AdjustmentModeEnum): void {
    if (mode === AdjustmentModeEnum.Sprite && this.editSpriteStore.previewAnimation()) {
      this.editSpriteStore.setPreviewAnimation(null);
    }
    if (this.spriteApp.isInitialized) {
      this.spriteApp.setAdjustmentMode(mode);
    }
  }

  private updatePreviewAnimation(animation: ISpriteAnimation | null): void {
    if (this.spriteApp.isInitialized) {
      if (this.editSpriteStore.adjustmentMode() === AdjustmentModeEnum.Animation) {
        this.setFramesAnimationInfo(animation);
      }
      this.spriteApp.setAnimation(animation);
    }
  }

  private async initializePixi(): Promise<void> {
    const sprite = this.editSpriteStore.sprite();
    if (sprite && this.appPixiRef()?.nativeElement) {
      this.spriteApp.centeredAfterScale = true;
      await this.spriteApp.initialize(this.appPixiRef()!.nativeElement);
      await this.spriteApp.initializeSprite(sprite);
      this.spriteApp.onPlayChanged = (playing: boolean): void => {
        this.spritePlayingState.set(playing);
      };
      this.spriteApp.onAnimationFrameChange = (layerGuid: string, currentFrame: number): void => {
        this.framesAnimationInfo.update((infoList: IFramesAnimationInfo[]) => {
          const index = infoList.findIndex((i: IFramesAnimationInfo) => i.layerGuid === layerGuid);
          if (index !== -1) {
            infoList[index] = {
              ...infoList[index],
              currentFrame: currentFrame + 1,
            };
          }
          return [...infoList];
        });
      };
    }
    this.isInitializing.set(false);
  }

  private setFramesAnimationInfo(animation: ISpriteAnimation | null): void {
    const layers = this.editSpriteStore.layers();
    const info = [];
    if (layers) {
      for (const layer of layers) {
        if (
          (animation?.layers || []).some(
            (animationLayer: ISpriteAnimationLayer) => animationLayer.layerGuid === layer.guid,
          )
        ) {
          info.push({
            layerGuid: layer.guid,
            layerName: layer.name,
            currentFrame: 1,
            totalFrames: layer.frames.length,
          });
        }
      }
    }
    this.framesAnimationInfo.set(info);
  }
}
