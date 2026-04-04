import { inject, Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import { SpritesFacade } from '~core/facade';
import { ISprite, ITilesGrid } from '~core/interfaces';
import { TilesGridRepository } from '~core/repositories';
import { CacheFramesCanvasService, ICacheFramesCanvas } from '~services/cache-frames-canvas.service';

@Injectable({
  providedIn: 'root',
})
export class PixiAppService {
  private readonly cacheFramesCanvasService = inject(CacheFramesCanvasService);

  private readonly tilesGridRepository = inject(TilesGridRepository);

  private readonly spritesFacade = inject(SpritesFacade);

  async getFrameCanvasCache(frameId: number): Promise<ICacheFramesCanvas | null> {
    return this.cacheFramesCanvasService.getFrameCanvasCache(frameId);
  }

  async fetchGridById(id: number): Promise<ITilesGrid> {
    return lastValueFrom(this.tilesGridRepository.fetchGridById(id));
  }

  async fetchSpriteById(id: number): Promise<ISprite> {
    return lastValueFrom(this.spritesFacade.fetchSpriteById(id));
  }
}
