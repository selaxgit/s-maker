import { AnimatedSprite, Container, DestroyOptions, Graphics } from 'pixi.js';
import { Subject, takeUntil } from 'rxjs';

import {
  ICoords,
  IRect,
  ISprite,
  ISpriteAnimation,
  ISpriteAnimationLayer,
  ISpriteInfo,
  ISpriteLayersListItem,
} from '../../../interfaces';
import { FramesCacheService } from '../../../services/cache';
import { ISpriteAnimationFrameEvent } from './interfaces';
import { LayersContainer } from './layers.container';

const SPRITE_GROUND_COLOR = 0xaa4f08;
const SPRITE_COLLISION_COLOR = 0x00b899;

interface IStoreSpriteAnimation {
  id: number;
  default: boolean;
  layers: ISpriteAnimationLayer[];
}

export class ViewSpriteContainer extends Container {
  public spriteWidth = 0;

  public spriteHeight = 0;

  public animationCompleteEvent = new Subject<void>();

  public animationFrameChangeEvent = new Subject<ISpriteAnimationFrameEvent>();

  public spriteMouseEnterEvent = new Subject<AnimatedSprite>();

  public spriteMouseLeaveEvent = new Subject<AnimatedSprite>();

  private readonly gSpriteRect = new Graphics();

  private readonly gSpriteGround = new Graphics();

  private readonly gSpriteCollision = new Graphics();

  private readonly layersContainer = new LayersContainer(this.framesCacheService);

  private ngUnsubscribe = new Subject<void>();

  private storeSpriteAnimation: IStoreSpriteAnimation[] = [];

  constructor(private readonly framesCacheService: FramesCacheService) {
    super();
    this.initialize();
  }

  public set play(val: boolean) {
    this.layersContainer.play = val;
  }

  public get playing(): boolean {
    return this.layersContainer.playing;
  }

  public override destroy(option?: DestroyOptions): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.layersContainer.destroy(option);
    super.destroy(option);
  }

  public setCurrentFrame(frame: number): void {
    this.layersContainer.setCurrentFrame(frame);
  }

  public setAnimationById(id: number | null): void {
    let animation: IStoreSpriteAnimation | undefined = undefined;
    if (id) {
      animation = this.storeSpriteAnimation.find((i: IStoreSpriteAnimation) => i.id === id);
    } else {
      animation = this.storeSpriteAnimation.find((i: IStoreSpriteAnimation) => i.default);
    }
    this.layersContainer.updateSpriteLayers(animation?.layers ?? []);
  }

  public setAnimation(animation: ISpriteAnimation | null): void {
    this.layersContainer.updateSpriteLayers(animation?.layers ?? []);
  }

  public updateSpriteLayers(layers: ISpriteAnimationLayer[]): void {
    this.layersContainer.updateSpriteLayers(layers);
  }

  public drawSpriteCollisionRect(rect: IRect | null): void {
    this.gSpriteCollision.clear();
    if (rect) {
      this.gSpriteCollision.rect(rect.x, rect.y, rect.width, rect.height).fill({
        color: SPRITE_COLLISION_COLOR,
        alpha: 0.5,
      });
    }
  }

  public drawSpriteGround(coords: ICoords | null): void {
    this.gSpriteGround.clear();
    if (coords) {
      this.gSpriteGround
        .moveTo(0, coords.y)
        .lineTo(this.width, coords.y)
        .stroke({ width: 1, color: SPRITE_GROUND_COLOR })
        .circle(coords.x, coords.y, 5)
        .fill(SPRITE_GROUND_COLOR);
    }
  }

  public drawSpriteRect(width: number, height: number, strokeColor: number | null = null): void {
    this.gSpriteRect.clear().rect(0, 0, width, height);
    if (strokeColor !== null) {
      this.gSpriteRect.stroke({ width: 1, color: strokeColor });
    }
  }

  public async setLayers(layers: ISpriteLayersListItem[]): Promise<void> {
    await this.layersContainer.setLayers(layers);
  }

  public initSprite(sprite: ISprite, strokeColor: number | null = null, visibleGroundPoint?: boolean): void {
    this.drawSpriteRect(sprite.width, sprite.height, strokeColor);
    this.layersContainer.spriteWidth = sprite.width;
    this.layersContainer.spriteHeight = sprite.height;
    if (visibleGroundPoint === undefined) {
      visibleGroundPoint = sprite.visibleGroundPoint;
    }
    if (visibleGroundPoint && sprite.groundPointX && sprite.groundPointY) {
      this.drawSpriteGround({ x: sprite.groundPointX, y: sprite.groundPointY });
    }
  }

  public async initSpriteByInfo(info: ISpriteInfo): Promise<void> {
    this.spriteWidth = info.spriteInfo.width;
    this.spriteHeight = info.spriteInfo.height;
    this.layersContainer.spriteWidth = info.spriteInfo.width;
    this.layersContainer.spriteHeight = info.spriteInfo.height;
    await this.layersContainer.setLayers(info.spriteLayers);
    this.storeSpriteAnimation = info.spriteAnimation.map((i: ISpriteAnimation) => ({
      id: i.id,
      default: i.default,
      layers: i.layers,
    }));
    const defAnimation = this.storeSpriteAnimation.find((i: IStoreSpriteAnimation) => i.default);
    let layers: ISpriteAnimationLayer[] = defAnimation?.layers ?? [];
    if (!defAnimation && info.spriteLayers.length > 0 && info.spriteLayers[0].frames.length > 0) {
      layers = [
        {
          layerId: info.spriteLayers[0].id,
          loop: false,
          speed: 1,
          frames: [
            {
              id: info.spriteLayers[0].frames[0].id,
              name: info.spriteLayers[0].frames[0].name,
              speed: null,
            },
          ],
        },
      ];
    }
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const strokeColor = layers.length === 0 ? 0xff0000 : null;
    this.layersContainer.updateSpriteLayers(layers);
    this.drawSpriteRect(info.spriteInfo.width, info.spriteInfo.height, strokeColor);
  }

  private initialize(): void {
    this.addChild(this.layersContainer);
    this.addChild(this.gSpriteCollision);
    this.addChild(this.gSpriteGround);
    this.addChild(this.gSpriteRect);
    this.layersContainer.animationFrameChangeEvent
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((currentFrame: ISpriteAnimationFrameEvent) => {
        this.animationFrameChangeEvent.next(currentFrame);
      });
    this.layersContainer.animationCompleteEvent.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.animationCompleteEvent.next();
    });
    this.layersContainer.spriteMouseEnterEvent
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((sprite: AnimatedSprite) => {
        this.spriteMouseEnterEvent.next(sprite);
      });
    this.layersContainer.spriteMouseLeaveEvent
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((sprite: AnimatedSprite) => {
        this.spriteMouseLeaveEvent.next(sprite);
      });
  }
}
