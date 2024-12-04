import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { BehaviorSubject, finalize, forkJoin, Observable, of, switchMap, tap } from 'rxjs';

import { NumberHelper } from '../common/helpers';
import {
  IAnimationPlayingInfo,
  ISprite,
  ISpriteAnimation,
  ISpriteFrame,
  ISpriteLayer,
  ISpriteLayersListItem,
  IViewTile,
  SpriteEditStateType,
} from '../common/interfaces';
import { SpriteLayersService, SpritesService } from '../common/services/sprites';
import { SpritesAnimationService } from '../common/services/sprites/sprite-animation.service';
import { SpriteFramesService } from '../common/services/sprites/sprite-frames.service';

interface SpriteState {
  sprite: ISprite | null;
  layers: ISpriteLayersListItem[];
  currentLayer: ISpriteLayer | null;
  currentFrame: ISpriteFrame | null;
  currentAnimation: ISpriteAnimation | null;
  spriteEditState: SpriteEditStateType;
  animations: ISpriteAnimation[];
  animationPlaying: IAnimationPlayingInfo | null;
}

interface IAddLayerPayload {
  projectId: number;
  name: string;
}

interface IUpdateFramePayload {
  id: number;
  layerId: number;
  frame: Partial<ISpriteFrame>;
}

interface IRemoveFramePayload {
  id: number;
  layerId: number;
}

interface IReOrderFramesPayload {
  layerId: number;
  frames: ISpriteFrame[];
}

interface IAddLayerFrameFromFiles {
  projectId: number;
  spriteId: number;
  layerId: number;
  startIdxName: number;
  files: FileList;
}

interface IAddLayerFrameFromCollection {
  projectId: number;
  spriteId: number;
  layerId: number;
  startIdxName: number;
  frames: IViewTile[];
}

const initialState: SpriteState = {
  sprite: null,
  layers: [],
  currentLayer: null,
  currentFrame: null,
  currentAnimation: null,
  spriteEditState: 'adjustment',
  animations: [],
  animationPlaying: null,
};

@Injectable()
export class SpriteStore extends ComponentStore<SpriteState> {
  private isInitializing = new BehaviorSubject<boolean>(true);

  readonly isInitializing$ = this.isInitializing.asObservable();

  private isLayersLoading = new BehaviorSubject<boolean>(false);

  readonly isLayersLoading$ = this.isInitializing.asObservable();

  readonly sprite$ = this.select((state: SpriteState) => state.sprite);

  readonly layers$ = this.select((state: SpriteState) => state.layers);

  readonly currentLayer$ = this.select((state: SpriteState) => state.currentLayer);

  readonly currentFrame$ = this.select((state: SpriteState) => state.currentFrame);

  readonly currentAnimation$ = this.select((state: SpriteState) => state.currentAnimation);

  readonly spriteEditState$ = this.select((state: SpriteState) => state.spriteEditState);

  readonly animationPlaying$ = this.select((state: SpriteState) => state.animationPlaying);

  readonly animations$ = this.select((state: SpriteState) => state.animations);

  readonly allLayerVisibledState$ = this.select((state: SpriteState) => {
    const visibles: boolean[] = state.layers.map((item: ISpriteLayersListItem) => item.visible);
    const visible = visibles.filter((i: boolean) => i);
    const notVisible = visibles.filter((i: boolean) => !i);
    return visible.length >= notVisible.length;
  });

  constructor(
    private readonly spritesService: SpritesService,
    private readonly spriteLayersService: SpriteLayersService,
    private readonly spriteFramesService: SpriteFramesService,
    private readonly spritesAnimationService: SpritesAnimationService,
  ) {
    super(initialState);
  }

  public initialize(id: string | null): void {
    if (!NumberHelper.isNumber(id)) {
      this.patchState({ sprite: null });
    }
    this.isInitializing.next(true);
    this.spritesService
      .get(Number(id))
      .pipe(
        tap((sprite: ISprite) => this.patchState({ sprite })),
        switchMap(() =>
          this.fetchLayersWithFrames(Number(id)).pipe(
            tap((layers: ISpriteLayersListItem[]) => {
              this.patchState({ layers });
              this.updateAnimations();
            }),
          ),
        ),
        finalize(() => this.isInitializing.next(false)),
      )
      .subscribe();
  }

  public updateSprite(payload: Partial<ISprite>): void {
    const sprite = this.get().sprite;
    if (!sprite) {
      return;
    }
    this.spritesService
      .update(sprite.id, payload)
      .subscribe((updated: ISprite) => this.patchState({ sprite: updated }));
  }

  public addLayer(payload: IAddLayerPayload): void {
    const sprite = this.get().sprite;
    if (!sprite) {
      return;
    }
    this.isLayersLoading.next(true);
    this.spriteLayersService
      .add(payload.projectId, sprite.id, payload.name)
      .pipe(
        tap((layer: ISpriteLayer) => this.patchState({ currentLayer: layer })),
        switchMap(() => this.fetchLayersWithFrames(sprite.id)),
        tap((layers: ISpriteLayersListItem[]) => this.patchState({ layers })),
        finalize(() => this.isLayersLoading.next(false)),
      )
      .subscribe();
  }

  public selectLayerById(id: number): void {
    const findLayer = this.get().layers.find((item: ISpriteLayersListItem) => item.id === id);
    if (findLayer) {
      this.patchState({ currentLayer: this.layerListItemToSpriteLayer(findLayer), currentFrame: null });
    } else {
      this.patchState({ currentLayer: null, currentFrame: null });
    }
  }

  public setAllLayersVisible(visible: boolean): void {
    this.isLayersLoading.next(true);
    const ids = this.get().layers.map((item: ISpriteLayersListItem) => item.id);
    this.spriteLayersService
      .batchUpdate(ids, { visible })
      .pipe(finalize(() => this.isLayersLoading.next(false)))
      .subscribe(() => {
        const layers = this.get().layers.map((item: ISpriteLayersListItem) => ({ ...item, visible }));
        this.patchState({ layers });
      });
  }

  public updateLayer(id: number, fields: Partial<ISpriteLayer>): void {
    this.spriteLayersService.update(id, fields).subscribe(() => {
      const layers = this.get().layers.map((item: ISpriteLayersListItem) => {
        if (item.id === id) {
          const layer = { ...item, ...fields };
          if (this.get().currentLayer?.id === item.id) {
            this.patchState({ currentLayer: layer });
          }
          return layer;
        }
        return { ...item };
      });
      this.patchState({ layers });
    });
  }

  public removeLayer(id: number): void {
    this.spriteLayersService.remove(id).subscribe(() => {
      const layers = this.get().layers.filter((item: ISpriteLayersListItem) => item.id !== id);
      this.patchState({ layers });
    });
  }

  public reOrderLayers(layers: ISpriteLayersListItem[]): void {
    const forks: Observable<ISpriteLayer>[] = [];
    layers.forEach((item: ISpriteLayersListItem, idx: number) => {
      item.order = idx;
      forks.push(this.spriteLayersService.update(item.id, { order: idx }));
    });
    if (forks.length === 0) {
      return;
    }
    layers.sort((a: ISpriteLayersListItem, b: ISpriteLayersListItem) => (a.order ?? Infinity) - (b.order ?? Infinity));
    forkJoin(forks).subscribe(() => {
      this.patchState({ layers });
      return of(undefined);
    });
  }

  public addLayerFrameFromFiles(payload: IAddLayerFrameFromFiles): void {
    const sprite = this.get().sprite;
    if (!sprite) {
      return;
    }
    this.isLayersLoading.next(true);
    this.spriteFramesService
      .addFrameFromFiles(payload.projectId, payload.spriteId, payload.layerId, payload.startIdxName, payload.files)
      .pipe(
        switchMap((frame: void | ISpriteFrame) =>
          this.fetchLayersWithFrames(sprite.id).pipe(
            tap((layers: ISpriteLayersListItem[]) => this.patchState({ layers })),
            tap(() => {
              if (frame) {
                this.selectFrameById(frame.id);
              } else {
                this.selectLayerById(payload.layerId);
              }
            }),
          ),
        ),
        finalize(() => this.isLayersLoading.next(false)),
      )
      .subscribe();
  }

  public addLayerFrameFromCollection(payload: IAddLayerFrameFromCollection): void {
    const sprite = this.get().sprite;
    if (!sprite) {
      return;
    }
    this.isLayersLoading.next(true);
    this.spriteFramesService
      .addFrameFromCollection(
        payload.projectId,
        payload.spriteId,
        payload.layerId,
        payload.startIdxName,
        payload.frames,
      )
      .pipe(
        switchMap(() =>
          this.fetchLayersWithFrames(sprite.id).pipe(
            tap((layers: ISpriteLayersListItem[]) => this.patchState({ layers })),
          ),
        ),
        finalize(() => this.isLayersLoading.next(false)),
      )
      .subscribe();
  }

  public updateFrame(payload: IUpdateFramePayload): void {
    this.spriteFramesService.update(payload.id, payload.frame).subscribe(() => {
      const layers = this.get().layers.map((item: ISpriteLayersListItem) => {
        if (item.id === payload.layerId) {
          return {
            ...item,
            frames: item.frames.map((frame: ISpriteFrame) => {
              if (frame.id === payload.id) {
                const newFrame = { ...frame, ...payload.frame };
                if (this.get().currentFrame?.id === frame.id) {
                  this.patchState({ currentFrame: newFrame });
                }
                return newFrame;
              } else {
                return { ...frame };
              }
            }),
          };
        }
        return { ...item };
      });
      this.patchState({ layers });
    });
  }

  public removeFrame(payload: IRemoveFramePayload): void {
    this.spriteFramesService.remove(payload.id).subscribe(() => {
      const layers = this.get().layers.map((item: ISpriteLayersListItem) => {
        if (item.id === payload.layerId) {
          return {
            ...item,
            frames: item.frames.filter((frame: ISpriteFrame) => frame.id !== payload.id),
          };
        }
        return { ...item };
      });
      this.patchState({ layers });
    });
  }

  public selectFrameById(id: number): void {
    const findLayer = this.get().layers.find((layer: ISpriteLayersListItem) =>
      layer.frames.some((frame: ISpriteFrame) => frame.id === id),
    );
    if (findLayer) {
      const findFrame = findLayer.frames.find((frame: ISpriteFrame) => frame.id === id);
      this.patchState({
        currentLayer: this.layerListItemToSpriteLayer(findLayer),
        currentFrame: findFrame ?? null,
      });
    } else {
      this.patchState({ currentLayer: null, currentFrame: null });
    }
  }

  public reOrderFrames(payload: IReOrderFramesPayload): void {
    const layers = this.get().layers;
    const findLayer = layers.find((layer: ISpriteLayersListItem) => layer.id === payload.layerId);
    if (findLayer) {
      const forks: Observable<ISpriteFrame>[] = [];
      payload.frames.forEach((item: ISpriteFrame, idx: number) => {
        item.order = idx;
        forks.push(this.spriteFramesService.update(item.id, { order: idx }));
      });

      if (forks.length === 0) {
        return;
      }
      payload.frames.sort((a: ISpriteFrame, b: ISpriteFrame) => (a.order ?? Infinity) - (b.order ?? Infinity));
      findLayer.frames = payload.frames;
      forkJoin(forks).subscribe(() => {
        this.patchState({ layers });
      });
    }
  }

  public setCurrentAnimation(currentAnimation: ISpriteAnimation | null): void {
    this.patchState({ currentAnimation, animationPlaying: null });
  }

  public setAnimationPlaying(animationPlaying: IAnimationPlayingInfo): void {
    this.patchState({ animationPlaying });
  }

  public setSpriteEditState(spriteEditState: SpriteEditStateType): void {
    this.patchState({ spriteEditState });
    if (spriteEditState !== 'animations') {
      this.setCurrentAnimation(null);
    }
  }

  public removeAnimation(id: number): void {
    this.spritesAnimationService.remove(id).subscribe(() => {
      this.updateAnimations();
    });
  }

  public updateAnimations(): void {
    const spriteId = this.get().sprite?.id ?? null;
    if (spriteId) {
      this.spritesAnimationService.fetchAnimations(spriteId).subscribe((animations: ISpriteAnimation[]) => {
        this.patchState({ animations });
      });
    } else {
      this.patchState({ animations: [] });
    }
  }

  private layerListItemToSpriteLayer(listLayer: ISpriteLayersListItem): ISpriteLayer {
    // eslint-disable-next-line unused-imports/no-unused-vars
    const { frames, ...currentLayer } = listLayer;
    return currentLayer;
  }

  private fetchLayersWithFrames(spriteId: number): Observable<ISpriteLayersListItem[]> {
    return this.spriteLayersService.getListWithFrames(spriteId);
  }
}
