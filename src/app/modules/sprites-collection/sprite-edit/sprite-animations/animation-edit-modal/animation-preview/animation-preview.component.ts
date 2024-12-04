import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AppPixi, ViewSpriteContainer } from '../../../../../../common/classes';
import { SMCScaleButtonsComponent } from '../../../../../../common/components';
import { ISprite, ISpriteAnimationLayer, ISpriteLayersListItem, ZoomType } from '../../../../../../common/interfaces';
import { FramesCacheService } from '../../../../../../common/services/cache';
import { AnimationState, AnimationStore } from '../../../../../../stores/animation.store';

@Component({
    selector: 'sc-animation-preview',
    imports: [MatButtonModule, MatIconModule, SMCScaleButtonsComponent],
    templateUrl: './animation-preview.component.html',
    styleUrl: './animation-preview.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SCAnimationPreviewComponent implements AfterViewInit, OnDestroy {
  @Input() sprite: ISprite | null = null;

  @Input() layersList: ISpriteLayersListItem[] = [];

  @ViewChild('pixiContainer') pixiContainerRef!: ElementRef<HTMLDivElement>;

  private readonly appPixi = new AppPixi();

  private readonly spriteContainer = new ViewSpriteContainer(this.framesCacheService);

  private readonly destroyRef$ = inject(DestroyRef);

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly framesCacheService: FramesCacheService,
    private readonly animationStore: AnimationStore,
  ) {
    this.appPixi.onZoomDone = () => this.centeredSpriteContainer();
  }

  get isPlaying(): boolean {
    return this.spriteContainer?.playing ?? false;
  }

  ngAfterViewInit(): void {
    this.initializePixi();
  }

  ngOnDestroy(): void {
    this.appPixi.destroy();
  }

  onPlay(play: boolean): void {
    if (this.spriteContainer) {
      this.spriteContainer.play = play;
    }
  }

  onZoom(zoom: ZoomType): void {
    this.appPixi.setZoom(zoom, false);
  }

  private initializePixi(): void {
    this.appPixi.useScale = true;
    this.appPixi.initialize(this.pixiContainerRef.nativeElement).then(() => {
      if (this.sprite) {
        this.spriteContainer.initSprite(this.sprite, 0x000000, false);
        this.spriteContainer.setLayers(this.layersList);
        this.centeredSpriteContainer();
        this.appPixi.attachScaleContainer(this.spriteContainer);
      }
      this.initializeSubscriptions();
    });
  }

  private initializeSubscriptions(): void {
    this.animationStore.animation$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((value: AnimationState) => {
      this.updateSprite(value);
      this.cdr.markForCheck();
    });
  }

  private updateSprite(value: AnimationState): void {
    if (value.visibleGround && value.groundPoint) {
      this.spriteContainer.drawSpriteGround(value.groundPoint);
    } else {
      this.spriteContainer.drawSpriteGround(null);
    }
    if (value.visibleCollision && value.collisionFrame) {
      this.spriteContainer.drawSpriteCollisionRect(value.collisionFrame);
    } else {
      this.spriteContainer.drawSpriteCollisionRect(null);
    }
    this.spriteContainer.updateSpriteLayers(value.layers.filter((l: ISpriteAnimationLayer) => l.layerId));
  }

  private centeredSpriteContainer(): void {
    this.spriteContainer.x = (this.appPixi.screenWidth - this.spriteContainer.width) / 2;
    this.spriteContainer.y = (this.appPixi.screenHeight - this.spriteContainer.height) / 2;
  }
}
