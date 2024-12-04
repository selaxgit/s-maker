import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import { ISpriteFrame, IViewTile } from '../../interfaces';
import { IViewTilesCache, ViewTilesCacheService } from '../cache';
import { SpriteFramesService } from '../sprites/sprite-frames.service';
import { TilesGridService } from '../tiles';

@Injectable({ providedIn: 'root' })
export class FrameTilesCacheService extends ViewTilesCacheService {
  constructor(
    private readonly spriteFramesService: SpriteFramesService,
    private readonly tilesGridService: TilesGridService,
  ) {
    super();
  }

  protected override async setCache(info: IViewTilesCache): Promise<IViewTile> {
    const tile = await super.setCache(info);
    const frames = await lastValueFrom(
      this.spriteFramesService.fetchListByFilter((i: ISpriteFrame) => i.frameId === info.id),
    );
    const useInTilesGrid = await this.tilesGridService.useFrameInTilesGrid(info.id);
    const references = frames.length;
    tile.used = useInTilesGrid || references > 0;
    this.cacheStore.set(tile.id, tile);
    return this.cacheStore.get(tile.id) as IViewTile;
  }
}
