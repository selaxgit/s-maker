import { Injectable } from '@angular/core';

import { BaseCache } from '../../classes/base.cache';
import { CanvasHelper } from '../../helpers';

export interface IFrameSetCache {
  id: number;
  file: File;
}

export interface IFrameCache {
  id: number;
  file: File | null;
  canvas: HTMLCanvasElement | null;
  canvasFlipH: HTMLCanvasElement | null;
  canvasFlipV: HTMLCanvasElement | null;
  canvasFlipHV: HTMLCanvasElement | null;
  objectURL?: string;
}

@Injectable({ providedIn: 'root' })
export class FramesCacheService extends BaseCache<IFrameSetCache, IFrameCache> {
  protected async setCache(info: IFrameSetCache): Promise<IFrameCache> {
    let cacheFrame: IFrameCache;
    if (!info.file) {
      cacheFrame = {
        id: info.id,
        file: null,
        canvas: null,
        canvasFlipH: null,
        canvasFlipV: null,
        canvasFlipHV: null,
      };
    } else {
      const canvas = await CanvasHelper.fileToCanvas(info.file);
      let canvasFlipHV = CanvasHelper.canvasFlipHorizontal(canvas);
      canvasFlipHV = CanvasHelper.canvasFlipVertical(canvasFlipHV);
      cacheFrame = {
        id: info.id,
        file: info.file,
        canvas,
        canvasFlipH: CanvasHelper.canvasFlipHorizontal(canvas),
        canvasFlipV: CanvasHelper.canvasFlipVertical(canvas),
        canvasFlipHV,
      };
    }

    this.cacheStore.set(cacheFrame.id, cacheFrame);
    return this.cacheStore.get(cacheFrame.id) as IFrameCache;
  }
}
