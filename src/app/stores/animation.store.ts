import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, of, tap } from 'rxjs';

import { ICoords, IRect, ISpriteAnimation, ISpriteAnimationLayer } from '../common/interfaces';
import { SpritesAnimationService } from '../common/services/sprites/sprite-animation.service';

export interface AnimationState extends ISpriteAnimation {
  visibleGround: boolean;
  visibleCollision: boolean;
}

const initialState: AnimationState = {
  id: -1,
  spriteId: -1,
  projectId: -1,
  name: '',
  default: false,
  groundPoint: null,
  collisionFrame: null,
  layers: [],
  visibleGround: false,
  visibleCollision: false,
};

@Injectable()
export class AnimationStore extends ComponentStore<AnimationState> {
  readonly layers$ = this.select((state: AnimationState) => state.layers);

  readonly animation$ = this.select((state: AnimationState) => state);

  readonly removeLayer = this.updater((state: AnimationState, idx: number) => {
    state.layers.splice(idx, 1);
    return {
      ...state,
    };
  });

  readonly updateLayer = this.updater((state: AnimationState, data: { idx: number; layer: ISpriteAnimationLayer }) => {
    if (!state.layers[data.idx]) {
      return state;
    }
    state.layers[data.idx] = { ...data.layer };
    return {
      ...state,
    };
  });

  readonly addLayer = this.updater((state: AnimationState) => ({
    ...state,
    layers: [
      ...state.layers,
      {
        layerId: null,
        loop: false,
        speed: 1,
        frames: [],
      },
    ],
  }));

  readonly updateAnimation = this.updater((state: AnimationState, values: Partial<AnimationState>) => ({
    ...state,
    ...values,
  }));

  readonly updateGroundPoint = this.updater((state: AnimationState, coords: Partial<ICoords>) => ({
    ...state,
    groundPoint: { ...(state.groundPoint ?? { x: 0, y: 0 }), ...coords },
  }));

  readonly updateCollisionFrame = this.updater((state: AnimationState, rect: Partial<IRect>) => ({
    ...state,
    collisionFrame: { ...(state.collisionFrame ?? { x: 0, y: 0, width: 0, height: 0 }), ...rect },
  }));

  constructor(private readonly spritesAnimationService: SpritesAnimationService) {
    super(initialState);
  }

  public initialize(animation: ISpriteAnimation): void {
    this.patchState(animation);
  }

  public saveAnimation(projectId: number, spriteId: number): Observable<ISpriteAnimation | null> {
    const animationState = this.get();
    if (!Boolean(animationState.name)) {
      return of(null);
    }

    animationState.projectId = projectId;
    animationState.spriteId = spriteId;

    if (animationState.id && animationState.id > 0) {
      return this.spritesAnimationService
        .update(animationState.id, animationState)
        .pipe(tap((animation: ISpriteAnimation) => this.patchState(animation)));
    }

    return this.spritesAnimationService
      .add(animationState)
      .pipe(tap((animation: ISpriteAnimation) => this.patchState(animation)));
  }
}
