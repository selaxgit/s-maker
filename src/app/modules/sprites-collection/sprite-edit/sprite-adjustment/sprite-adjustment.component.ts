import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';

import { AppPixi, ISpriteAnimationFrameEvent } from '../../../../common/classes';
import { SMCScaleButtonsComponent } from '../../../../common/components';
import { ColorHelper } from '../../../../common/helpers';
import {
  IAnimationPlayingInfo,
  ISprite,
  ISpriteAnimation,
  ISpriteLayersListItem,
  SpriteEditStateType,
  ZoomType,
} from '../../../../common/interfaces';
import { FramesCacheService } from '../../../../common/services/cache';
import { SpriteStore } from '../../../../stores';
import { SpriteContainer } from './pixi/sprite.container';

type AnimationSetFrameType = 'first' | 'prev' | 'next' | 'last';

@Component({
    selector: 'sc-sprite-adjustment',
    imports: [CommonModule, MatButtonModule, MatIconModule, SMCScaleButtonsComponent],
    templateUrl: './sprite-adjustment.component.html',
    styleUrl: './sprite-adjustment.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SCSpriteAdjustmentComponent implements AfterViewInit, OnDestroy {
  @ViewChild('pixiContainer') pixiContainerRef!: ElementRef<HTMLDivElement>;

  animationFrameFromTotal: WritableSignal<string> = signal('0 из 0');

  readonly spriteEditState$ = this.spriteStore.spriteEditState$;

  readonly animationPlaying$ = this.spriteStore.animationPlaying$;

  readonly currentAnimation$ = this.spriteStore.currentAnimation$;

  private readonly appPixi = new AppPixi();

  private readonly spriteContainer = new SpriteContainer(this.framesCacheService);

  private readonly destroyRef$ = inject(DestroyRef);

  private hasInitViewSprite = false;

  private animationFrameCurrent = 0;

  private animationFrameTotal = 0;

  constructor(
    private readonly spriteStore: SpriteStore,
    private readonly framesCacheService: FramesCacheService,
  ) {
    this.appPixi.onZoomDone = () => this.centeredSpriteContainer();
  }

  ngAfterViewInit(): void {
    this.initializePixi();
  }

  ngOnDestroy(): void {
    this.appPixi.destroy();
  }

  onAnimationSetFrame(frame: AnimationSetFrameType): void {
    switch (frame) {
      case 'first':
        this.spriteContainer.setCurrentFrame(0);
        this.setCurrentFrame(0, this.animationFrameTotal);
        break;
      case 'prev': {
        const current =
          this.animationFrameCurrent - 1 < 0 ? this.animationFrameTotal - 1 : this.animationFrameCurrent - 1;
        this.spriteContainer.setCurrentFrame(current);
        this.setCurrentFrame(current, this.animationFrameTotal);
        break;
      }
      case 'next': {
        const current = this.animationFrameCurrent + 1 >= this.animationFrameTotal ? 0 : this.animationFrameCurrent + 1;
        this.spriteContainer.setCurrentFrame(current);
        this.setCurrentFrame(current, this.animationFrameTotal);
        break;
      }
      case 'last':
        this.spriteContainer.setCurrentFrame(this.animationFrameTotal - 1);
        this.setCurrentFrame(this.animationFrameTotal - 1, this.animationFrameTotal);
        break;
    }
  }

  onSetAnimationPlaying(playing: boolean): void {
    this.spriteStore.currentAnimation$.pipe(take(1)).subscribe((animation: ISpriteAnimation | null) => {
      if (animation) {
        this.spriteStore.setAnimationPlaying({
          id: animation.id,
          playing: playing,
        });
      }
    });
  }

  onZoom(zoom: ZoomType): void {
    this.appPixi.setZoom(zoom, false);
  }

  onSetSpriteEditState(state: SpriteEditStateType): void {
    this.spriteStore.setSpriteEditState(state);
  }

  private initializePixi(): void {
    this.appPixi.useScale = true;
    this.appPixi.initialize(this.pixiContainerRef.nativeElement).then(() => {
      this.appPixi.attachScaleContainer(this.spriteContainer);
      this.spriteContainer.animationFrameChangeEvent
        .pipe(takeUntilDestroyed(this.destroyRef$))
        .subscribe((currentFrame: ISpriteAnimationFrameEvent) => {
          this.setCurrentFrame(currentFrame.current, currentFrame.total);
        });
      this.spriteContainer.animationCompleteEvent.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe(() => {
        this.onSetAnimationPlaying(false);
      });
      this.initializeSubscriptions();
    });
  }

  private initializeSubscriptions(): void {
    this.spriteStore.sprite$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((sprite: ISprite | null) => {
      this.updateSprite(sprite);
    });
    this.spriteStore.layers$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((layers: ISpriteLayersListItem[]) => {
      this.updateLayers(layers);
    });
    this.spriteStore.spriteEditState$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((state: SpriteEditStateType) => {
        this.spriteContainer.setView(state);
      });
    this.spriteStore.currentAnimation$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((animation: ISpriteAnimation | null) => {
        this.spriteContainer.setAnimation(animation);
        if (animation?.layers[0]?.frames.length) {
          this.setCurrentFrame(0, animation.layers[0].frames.length);
        }
      });
    this.spriteStore.animationPlaying$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((state: IAnimationPlayingInfo | null) => {
        this.spriteContainer.animationPlay(state?.playing ?? false);
      });
  }

  private updateLayers(layers: ISpriteLayersListItem[]): void {
    this.spriteContainer.updateLayers(layers);
  }

  private updateSprite(sprite: ISprite | null): void {
    if (sprite) {
      this.spriteContainer.drawSpriteRect(
        sprite.width,
        sprite.height,
        sprite.bgColor ? ColorHelper.hex2hexadecimal(sprite.bgColor) : null,
      );
      if (sprite.visibleGroundPoint) {
        this.spriteContainer.drawSpriteGround({ x: sprite.groundPointX ?? 0, y: sprite.groundPointY ?? 0 });
      } else {
        this.spriteContainer.drawSpriteGround(null);
      }
      if (!this.hasInitViewSprite) {
        this.hasInitViewSprite = true;
        this.spriteContainer.initViewSprite(sprite);
      }
    } else {
      this.spriteContainer.drawSpriteRect(0, 0);
      this.spriteContainer.drawSpriteGround(null);
    }
    this.centeredSpriteContainer();
  }

  private centeredSpriteContainer(): void {
    this.spriteContainer.x = (this.appPixi.screenWidth - this.spriteContainer.width) / 2;
    this.spriteContainer.y = (this.appPixi.screenHeight - this.spriteContainer.height) / 2;
  }

  private setCurrentFrame(current: number, total: number): void {
    this.animationFrameCurrent = current;
    this.animationFrameTotal = total;
    this.animationFrameFromTotal.set(`${current + 1} из ${total}`);
  }
}
