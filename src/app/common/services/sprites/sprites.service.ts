/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { forkJoin, from, lastValueFrom, map, Observable, of, switchMap } from 'rxjs';

import { FileHelper } from '../../helpers';
import {
  ISprite,
  ISpriteAnimation,
  ISpriteAnimationLayer,
  ISpriteAnimationLayerFrame,
  ISpriteInfo,
  ISpriteLayersListItem,
  IViewTile,
} from '../../interfaces';
import { IViewTilesCache } from '../cache';
import { SpritesAnimationService } from './sprite-animation.service';
import { SpriteFramesService } from './sprite-frames.service';
import { SpriteLayersService } from './sprite-layers.service';
import { SpriteTilesCacheService } from './sprite-tiles.cache.service';
import { SpritesDBService } from './sprites.db.service';

@Injectable({ providedIn: 'root' })
export class SpritesService {
  constructor(
    private readonly spritesDBService: SpritesDBService,
    private readonly spriteTilesCacheService: SpriteTilesCacheService,
    private readonly spriteLayersService: SpriteLayersService,
    private readonly spriteFramesService: SpriteFramesService,
    private readonly spritesAnimationService: SpritesAnimationService,
  ) {}

  public cloneSprite(spriteId: number, name: string): Observable<number> {
    return this.getSpriteInfo(spriteId).pipe(switchMap((info: ISpriteInfo) => this.cloneSpriteByInfo(info, name)));
  }

  public getSpriteInfo(spriteId: number): Observable<ISpriteInfo> {
    return forkJoin([
      this.get(spriteId),
      this.spriteLayersService.getListWithFrames(spriteId),
      this.spritesAnimationService.fetchAnimations(spriteId),
    ]).pipe(
      map(([spriteInfo, spriteLayers, spriteAnimation]: [ISprite, ISpriteLayersListItem[], ISpriteAnimation[]]) => ({
        spriteInfo,
        spriteLayers,
        spriteAnimation,
      })),
    );
  }

  public insert(fields: Partial<ISprite>): Observable<ISprite> {
    return this.spritesDBService.insert(fields);
  }

  public get(id: number): Observable<ISprite> {
    return this.spritesDBService.get(id);
  }

  public update(id: number, frame: Partial<ISprite>): Observable<ISprite> {
    return this.spritesDBService.update(id, frame);
  }

  public remove(id: number): Observable<void> {
    return this.spritesDBService.remove(id).pipe(
      switchMap(() => {
        this.spriteTilesCacheService.removeCache(id);
        return of(undefined);
      }),
    );
  }

  public add(projectId: number, treeId: number | null, name: string): Observable<ISprite> {
    return this.spritesDBService.add(projectId, treeId, name);
  }

  public fetchByFilter(filter: (item: ISprite) => boolean): Observable<ISprite[]> {
    return this.spritesDBService.getListByFilter(filter);
  }

  public fetchTiles(projectId: number, treeId: number | null): Observable<IViewTile[]> {
    return this.spritesDBService
      .getListByFilter((item: ISprite) => item.projectId === projectId && item.treeId === treeId)
      .pipe(
        switchMap((sprites: ISprite[]) => from(this.transformSpritesToViewTiles(sprites))),
        switchMap((tiles: IViewTilesCache[]) => {
          return from(this.spriteTilesCacheService.getCacheByItems(tiles));
        }),
      );
  }

  public clearCache(): void {
    this.spriteTilesCacheService.clear();
  }

  private async transformSpritesToViewTiles(sprites: ISprite[]): Promise<IViewTilesCache[]> {
    const tilesList: IViewTilesCache[] = [];
    for (const sprite of sprites) {
      const layers = await lastValueFrom(this.spriteLayersService.getListWithFrames(sprite.id));
      const animations = await lastValueFrom(this.spritesAnimationService.fetchAnimations(sprite.id));
      let animation = animations.find((i: ISpriteAnimation) => i.default && i.layers.length > 0);
      if (!animation) {
        animation = animations.find((i: ISpriteAnimation) => i.layers.length > 0);
      }
      if (animation) {
        const layer = layers.find((i: ISpriteLayersListItem) => i.id === animation?.layers[0].layerId);
        if (layer && layer.frames[0].file) {
          let file = layer.frames[0].file;
          if (layer.flipHorizontal || layer.flipVertical) {
            file = await FileHelper.flipFile(layer.frames[0].file, layer.flipHorizontal, layer.flipVertical);
          }
          tilesList.push({
            id: sprite.id,
            treeId: sprite.treeId,
            name: sprite.name,
            file,
            width: sprite.width,
            height: sprite.height,
          });
          continue;
        }
      }
      let file: File | undefined = undefined;
      const layer = layers.find((i: ISpriteLayersListItem) => i.frames.length > 0);
      if (layer && layer.frames[0].file) {
        if (layer.flipHorizontal || layer.flipVertical) {
          file = await FileHelper.flipFile(layer.frames[0].file, layer.flipHorizontal, layer.flipVertical);
        } else {
          file = layer.frames[0].file;
        }
      }
      tilesList.push({
        id: sprite.id,
        treeId: sprite.treeId,
        name: sprite.name,
        file,
        width: sprite.width,
        height: sprite.height,
      });
    }
    return tilesList;
  }

  private async cloneSpriteByInfo(info: ISpriteInfo, name: string): Promise<number> {
    const spriteFields = { ...info.spriteInfo };
    delete (spriteFields as any).id;
    spriteFields.name = name;
    const sprite = await lastValueFrom(this.insert(spriteFields));
    const layersMap: Map<number, number> = new Map();
    const framesMap: Map<number, number> = new Map();
    for (const layerInfo of info.spriteLayers) {
      const { frames, ...layerFields } = layerInfo;
      delete (layerFields as any).id;
      layerFields.spriteId = sprite.id;
      const layer = await lastValueFrom(this.spriteLayersService.insert(layerFields));
      layersMap.set(layerInfo.id, layer.id);
      for (const frameInfo of frames) {
        const frameFields = { ...frameInfo };
        delete (frameFields as any).id;
        delete (frameFields as any).file;
        frameFields.spriteId = sprite.id;
        frameFields.layerId = layer.id;
        const frame = await lastValueFrom(this.spriteFramesService.insert(frameFields));
        framesMap.set(frameInfo.id, frame.id);
      }
    }
    for (const animationInfo of info.spriteAnimation) {
      const animationFields = { ...animationInfo };
      delete (animationFields as any).id;
      animationFields.spriteId = sprite.id;
      animationFields.layers = animationFields.layers
        .filter((l: ISpriteAnimationLayer) => layersMap.has(Number(l.layerId)))
        .map(
          (l: ISpriteAnimationLayer) =>
            ({
              ...l,
              layerId: layersMap.get(Number(l.layerId)),
              frames: l.frames
                .filter((f: ISpriteAnimationLayerFrame) => framesMap.has(f.id))
                .map((f: ISpriteAnimationLayerFrame) => ({
                  ...f,
                  id: framesMap.get(f.id),
                })),
            }) as ISpriteAnimationLayer,
        );
      await lastValueFrom(this.spritesAnimationService.insert(animationFields));
    }
    return sprite.id;
  }
}
