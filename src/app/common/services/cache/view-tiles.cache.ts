import { Injectable } from '@angular/core';

import { BaseCache } from '../../classes/base.cache';
import { CanvasHelper } from '../../helpers';
import { IViewTile } from '../../interfaces';

const THUMB_WIDTH = 100;
const THUMB_HEIGHT = 100;

export interface IViewTilesCache {
  id: number;
  treeId: number | null;
  name: string;
  file?: File;
  width: number;
  height: number;
}

@Injectable({ providedIn: 'root' })
export class ViewTilesCacheService extends BaseCache<IViewTilesCache, IViewTile> {
  protected async setCache(info: IViewTilesCache): Promise<IViewTile> {
    let cacheTile: IViewTile;
    if (!info.file) {
      cacheTile = {
        id: info.id,
        treeId: info.treeId,
        name: info.name,
        file: null,
        width: info.width,
        height: info.height,
        objectURL: '',
        tooltip: `${info.id}: ${info.name} (${info.width}x${info.height})`,
      };
    } else {
      const canvas = await CanvasHelper.fileToCanvas(info.file, THUMB_WIDTH, THUMB_HEIGHT);
      const blob = await CanvasHelper.canvasToBlob(canvas);
      cacheTile = {
        id: info.id,
        treeId: info.treeId,
        name: info.name,
        file: info.file,
        width: info.width,
        height: info.height,
        objectURL: `url(${URL.createObjectURL(blob)})`,
        tooltip: `${info.id}: ${info.name} (${info.width}x${info.height})`,
      };
    }
    this.cacheStore.set(cacheTile.id, cacheTile);
    return this.cacheStore.get(cacheTile.id) as IViewTile;
  }

  public override async getCache(item: IViewTilesCache): Promise<IViewTile> {
    const cache = await super.getCache(item);
    cache.name = item.name;
    return cache;
  }
}
