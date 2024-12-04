/* eslint-disable @typescript-eslint/no-magic-numbers */
import { AnimatedSprite, DestroyOptions } from 'pixi.js';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';

import { ViewSpriteContainer } from '../../../../../common/classes';
import { ICoords, ISceneObject } from '../../../../../common/interfaces';
import { FramesCacheService } from '../../../../../common/services/cache';
import { SpritesService } from '../../../../../common/services/sprites';
import { BaseLayer } from './base.layer';
import { SELECT_TINT_COLOR } from './constants';

export class LayerSprites extends BaseLayer {
  private sprites: Map<number, ViewSpriteContainer> = new Map();

  private hUnsubscribe = new Subject<void>();

  constructor(
    private readonly framesCacheService: FramesCacheService,
    private readonly spritesService: SpritesService,
  ) {
    super();
  }

  public override destroy(options?: DestroyOptions): void {
    this.hUnsubscribe.next();
    this.hUnsubscribe.complete();
    this.sprites.forEach((sprite: ViewSpriteContainer) => sprite.destroy());
    this.sprites.clear();
    super.destroy(options);
  }

  public override async updateLayer(object: ISceneObject): Promise<void> {
    super.updateLayer(object);
    this.maxWidth = 0;
    this.maxHeight = 0;
    const realIds: number[] = [];
    for (const child of object.children) {
      await this.updateSprite(child);
      realIds.push(child.id);
    }
    this.sprites.forEach((sprite: ViewSpriteContainer, key: number) => {
      if (!realIds.includes(key)) {
        sprite.destroy();
        this.sprites.delete(key);
      } else {
        if (this.maxWidth < sprite.x + sprite.spriteWidth) {
          this.maxWidth = sprite.x + sprite.spriteWidth;
        }
        if (this.maxHeight < sprite.y + sprite.spriteHeight) {
          this.maxHeight = sprite.y + sprite.spriteHeight;
        }
      }
    });
  }

  private async updateSprite(obj: ISceneObject): Promise<void> {
    if (!obj.referenceId) {
      return;
    }
    let viewSprite: ViewSpriteContainer | null = null;
    if (this.sprites.has(obj.id)) {
      viewSprite = this.sprites.get(obj.id) as ViewSpriteContainer;
    } else {
      const spriteInfo = await lastValueFrom(this.spritesService.getSpriteInfo(obj.referenceId));
      viewSprite = new ViewSpriteContainer(this.framesCacheService);
      await viewSprite.initSpriteByInfo(spriteInfo);
      this.sprites.set(obj.id, viewSprite);
      this.addChild(viewSprite);
      viewSprite.spriteMouseEnterEvent.pipe(takeUntil(this.hUnsubscribe)).subscribe((sprite: AnimatedSprite) => {
        sprite.tint = ['info', 'drag-object'].includes(this.toolStateValue) ? SELECT_TINT_COLOR : 0xffffff;
        if (viewSprite) {
          this.objectEnterEvent.next({
            objectId: obj.id,
            type: 'sprite',
            x: viewSprite.x,
            y: viewSprite.y,
            onUpdateXY: (coords: ICoords) => {
              if (viewSprite) {
                viewSprite.x = coords.x;
                viewSprite.y = coords.y;
              }
            },
            onGetXYWH: () => {
              if (viewSprite) {
                return {
                  x: viewSprite.x,
                  y: viewSprite.y,
                  width: viewSprite.width,
                  height: viewSprite.height,
                };
              }
              return null;
            },
            onCanAction: () => 'drag',
            onGetCursor: () => 'move',
          });
        }
      });
      viewSprite.spriteMouseLeaveEvent.pipe(takeUntil(this.hUnsubscribe)).subscribe((sprite: AnimatedSprite) => {
        sprite.tint = 0xffffff;
        this.objectLeaveEvent.next({
          objectId: obj.id,
          type: 'sprite',
        });
      });
    }
    if (viewSprite) {
      viewSprite.x = obj.x;
      viewSprite.y = obj.y;
      viewSprite.zIndex = obj.zIndex;
      viewSprite.visible = obj.visible;
      if (obj.animationId) {
        viewSprite.setAnimationById(obj.animationId);
        setTimeout(() => (viewSprite.play = Boolean(obj.playing)), 100);
      }
    }
  }
}
