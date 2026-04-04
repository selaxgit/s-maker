import { inject, Injectable } from '@angular/core';
import { SUCanvasHelper } from '@selax/utils';
import { lastValueFrom } from 'rxjs';

import { FramesRepository } from '~core/repositories';

export interface ICacheFramesCanvas {
  frameId: number;
  canvas: HTMLCanvasElement;
  canvasFlipH: HTMLCanvasElement;
  canvasFlipV: HTMLCanvasElement;
  canvasFlipHV: HTMLCanvasElement;
}

@Injectable({ providedIn: 'root' })
export class CacheFramesCanvasService {
  private readonly framesRepository = inject(FramesRepository);

  private readonly framesCached = new Map<number, ICacheFramesCanvas>();

  invalidate(frameId: number): void {
    this.framesCached.delete(frameId);
  }

  async getFrameCanvasCache(frameId: number): Promise<ICacheFramesCanvas | null> {
    if (this.framesCached.has(frameId)) {
      return this.framesCached.get(frameId) as ICacheFramesCanvas;
    }
    const frame = await lastValueFrom(this.framesRepository.fetchFrameById(frameId));
    if (!frame) {
      return null;
    }
    const canvas = await SUCanvasHelper.fileToCanvas(frame.file);
    let canvasFlipHV = SUCanvasHelper.canvasFlipHorizontal(canvas);
    canvasFlipHV = SUCanvasHelper.canvasFlipVertical(canvasFlipHV);
    const cache = {
      frameId,
      canvas,
      canvasFlipH: SUCanvasHelper.canvasFlipHorizontal(canvas),
      canvasFlipV: SUCanvasHelper.canvasFlipVertical(canvas),
      canvasFlipHV,
    };
    this.framesCached.set(frameId, cache);
    return cache;
  }
}
