import { EventEmitter } from '@angular/core';
import { Container, DestroyOptions, Graphics } from 'pixi.js';
import { Subject, takeUntil } from 'rxjs';

import { ISpriteAnimationFrameEvent, ViewSpriteContainer } from '../../../../../common/classes';
import {
  ICoords,
  ISprite,
  ISpriteAnimation,
  ISpriteLayersListItem,
  SpriteEditStateType,
} from '../../../../../common/interfaces';
import { FramesCacheService } from '../../../../../common/services/cache';
import { AdjustmentContainer } from './adjustment.container';

const SPRITE_GROUND_COLOR = 0xaa4f08;

export class SpriteContainer extends Container {
  public animationCompleteEvent = new EventEmitter<void>();

  public animationFrameChangeEvent = new EventEmitter<ISpriteAnimationFrameEvent>();

  private readonly gSpriteRect = new Graphics();

  private readonly gSpriteGround = new Graphics();

  private readonly adjustmentContainer = new AdjustmentContainer(this.framesCacheService);

  private readonly viewSpriteContainer = new ViewSpriteContainer(this.framesCacheService);

  private ngUnsubscribe = new Subject<void>();

  constructor(private readonly framesCacheService: FramesCacheService) {
    super();
    this.initialize();
  }

  public get rectWidth(): number {
    return this.gSpriteRect.width;
  }

  public get rectHeight(): number {
    return this.gSpriteRect.height;
  }

  public override destroy(option?: DestroyOptions): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.adjustmentContainer.destroy(option);
    this.viewSpriteContainer.destroy(option);
    super.destroy(option);
  }

  public setCurrentFrame(frame: number): void {
    this.viewSpriteContainer.setCurrentFrame(frame);
  }

  public animationPlay(play: boolean): void {
    this.viewSpriteContainer.play = play;
  }

  public setAnimation(animation: ISpriteAnimation | null): void {
    this.viewSpriteContainer.setAnimation(animation);
  }

  public initViewSprite(sprite: ISprite): void {
    this.viewSpriteContainer.initSprite(sprite);
  }

  public setView(state: SpriteEditStateType): void {
    if (state === 'adjustment') {
      this.viewSpriteContainer.visible = false;
      this.adjustmentContainer.visible = true;
    } else {
      this.adjustmentContainer.visible = false;
      this.viewSpriteContainer.visible = true;
    }
  }

  public updateLayers(layers: ISpriteLayersListItem[]): void {
    this.adjustmentContainer.updateLayers(layers);
    this.viewSpriteContainer.setLayers(layers);
  }

  public drawSpriteGround(coords: ICoords | null): void {
    this.gSpriteGround.clear();
    if (coords) {
      this.gSpriteGround
        .moveTo(0, coords.y)
        .lineTo(this.rectWidth, coords.y)
        .stroke({ width: 1, color: SPRITE_GROUND_COLOR })
        .circle(coords.x, coords.y, 5)
        .fill(SPRITE_GROUND_COLOR);
    }
  }

  public drawSpriteRect(width: number, height: number, fillColor: number | null = null): void {
    this.gSpriteRect.clear().rect(0, 0, width, height);
    if (fillColor !== null) {
      this.gSpriteRect.fill(fillColor);
    }
    this.gSpriteRect.stroke({ width: 1, color: 0x000000 });
  }

  private initialize(): void {
    this.addChild(this.viewSpriteContainer);
    this.addChild(this.adjustmentContainer);
    this.addChild(this.gSpriteRect);
    this.addChild(this.gSpriteGround);
    this.viewSpriteContainer.animationFrameChangeEvent
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((currentFrame: ISpriteAnimationFrameEvent) => {
        this.animationFrameChangeEvent.emit(currentFrame);
      });
    this.viewSpriteContainer.animationCompleteEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.animationCompleteEvent.emit();
    });
  }
}
