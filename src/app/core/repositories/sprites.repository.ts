import { inject, Injectable } from '@angular/core';
import { SUCanvasHelper, SUJsonHelper } from '@selax/utils';
import { from, lastValueFrom, Observable, of, switchMap, throwError } from 'rxjs';

import { DBSprites } from '~core/db';
import { UsedHelperService } from '~core/helpers';
import { IViewTile } from '~core/interfaces/common.interface';
import { ISprite, ISpriteAnimation, ISpriteAnimationLayer, ISpriteLayer } from '~core/interfaces/sprites.interface';
import { ProjectStore, SpritesStore } from '~core/stores';
import { CacheFramesCanvasService } from '~services/cache-frames-canvas.service';

const PREVIEW_WIDTH = 100;
const PREVIEW_HEIGHT = 100;

@Injectable({
  providedIn: 'root',
})
export class SpritesRepository {
  private readonly dbSprites = inject(DBSprites);

  private readonly spritesStore = inject(SpritesStore);

  private readonly projectStore = inject(ProjectStore);

  private readonly cacheFramesCanvasService = inject(CacheFramesCanvasService);

  private readonly usedHelperService = inject(UsedHelperService);

  saveSprite(sprite: ISprite): Observable<ISprite> {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      return throwError(() => new Error('Project ID не установлен для сохранение спрайта'));
    }

    const fields = SUJsonHelper.clone(sprite);
    fields.projectId = projectId;
    let method;
    if (fields.id < 0) {
      delete fields.id;
      method = this.dbSprites.insert(fields);
    } else {
      method = this.dbSprites.update(fields.id, fields);
    }
    return method;
  }

  updateSpriteTreeId(id: number, treeId: number | null): Observable<void> {
    this.spritesStore.updateTileTreeId(id, treeId);
    return this.dbSprites.update(id, { treeId }).pipe(switchMap(() => of(void 0)));
  }

  removeSprite(id: number): Observable<void> {
    return this.dbSprites.remove(id).pipe(
      switchMap(() => {
        this.spritesStore.removeTile(id);
        return of(void 0);
      }),
    );
  }

  fetchSpriteById(id: number): Observable<ISprite> {
    return this.dbSprites.get(id).pipe(
      switchMap((sprite: ISprite | null) => {
        if (!sprite) {
          return throwError(() => new Error(`Спрайт не найден по id: ${id}`));
        }
        return of(sprite);
      }),
    );
  }

  fetchSprites(projectId: number): Observable<void> {
    return this.dbSprites
      .getListByFilter((item: ISprite) => item.projectId == projectId)
      .pipe(switchMap((sprites: ISprite[]) => from(this.spriteListToTiles(sprites))));
  }

  reset(): void {
    this.spritesStore.setTiles([]);
  }

  async spriteToTile(sprite: ISprite, usedSpritesIds: number[]): Promise<IViewTile> {
    let objectURL: string = '';
    const previewCanvas = await this.getSpritePreviewCanvas(sprite);
    if (previewCanvas) {
      const blob = await SUCanvasHelper.canvasToBlob(previewCanvas);
      objectURL = URL.createObjectURL(blob);
    }
    return {
      id: sprite.id,
      treeId: sprite.treeId,
      name: sprite.name,
      tooltip: `${sprite.id}: ${sprite.name} (${sprite.width}x${sprite.height})`,
      objectURL,
      fileWidth: sprite.width,
      fileHeight: sprite.height,
      used: usedSpritesIds.includes(sprite.id),
      selected: false,
    };
  }

  async updateSpritePreview(sprite: ISprite): Promise<void> {
    let objectURL: string = '';
    const previewCanvas = await this.getSpritePreviewCanvas(sprite);
    if (previewCanvas) {
      const blob = await SUCanvasHelper.canvasToBlob(previewCanvas);
      objectURL = URL.createObjectURL(blob);
    }
    this.spritesStore.updateTile({ id: sprite.id, objectURL });
  }

  private async spriteListToTiles(sprites: ISprite[]): Promise<void> {
    if (sprites.length === 0) {
      this.spritesStore.setTiles([]);
      return;
    }
    const usedSpritesIds = await lastValueFrom(this.usedHelperService.getUsedSpritesIds(sprites[0].projectId));
    const tiles = await Promise.all(sprites.map((sprite: ISprite) => this.spriteToTile(sprite, usedSpritesIds)));
    this.spritesStore.setTiles(tiles);
  }

  private async getSpritePreviewCanvas(sprite: ISprite): Promise<HTMLCanvasElement | null> {
    let animation = sprite.animations.find((i: ISpriteAnimation) => i.default && i.layers.length > 0);
    if (!animation) {
      animation = sprite.animations.find((i: ISpriteAnimation) => i.layers.length > 0);
    }
    let spriteLayers: ISpriteLayer[] = [];
    if (animation) {
      const layerGuids = animation.layers.map((i: ISpriteAnimationLayer) => i.layerGuid);
      spriteLayers = sprite.layers.filter((i: ISpriteLayer) => layerGuids.includes(i.guid));
    } else {
      const layer = sprite.layers.find((i: ISpriteLayer) => i.visible);
      if (layer) {
        spriteLayers.push(layer);
      }
    }
    if (spriteLayers.length === 0) {
      return null;
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('SpritesListStore:getSpritePreviewCanvas - canvas has not ctx');
    }
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    let failPreview = true;
    for (const layerInfo of spriteLayers) {
      if (layerInfo.frames[0] === undefined) {
        continue;
      }
      const frame = layerInfo.frames[0];
      const frameCanvasCache = await this.cacheFramesCanvasService.getFrameCanvasCache(frame.frameId);
      if (!frameCanvasCache) {
        continue;
      }
      const x = layerInfo.x + frame.x;
      const y = layerInfo.y + frame.y;
      if (layerInfo.flipHorizontal && layerInfo.flipVertical) {
        ctx.drawImage(frameCanvasCache.canvasFlipHV, x, y);
      } else if (layerInfo.flipHorizontal && !layerInfo.flipVertical) {
        ctx.drawImage(frameCanvasCache.canvasFlipH, x, y);
      } else if (!layerInfo.flipHorizontal && layerInfo.flipVertical) {
        ctx.drawImage(frameCanvasCache.canvasFlipV, x, y);
      } else {
        ctx.drawImage(frameCanvasCache.canvas, x, y);
      }
      failPreview = false;
    }
    return failPreview ? null : SUCanvasHelper.scaleCanvas(canvas, PREVIEW_WIDTH, PREVIEW_HEIGHT);
  }
}
