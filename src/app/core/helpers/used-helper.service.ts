import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { SceneLayerTypeEnum } from '~core/constants';
import { DBGrid, DBScenes, DBSprites } from '~core/db';
import { IScene, ISceneObjectSprite, ISprite, ITilesGrid } from '~core/interfaces';

@Injectable({
  providedIn: 'root',
})
export class UsedHelperService {
  private readonly dbSprites = inject(DBSprites);

  private readonly dbGrid = inject(DBGrid);

  private readonly dbScenes = inject(DBScenes);

  getUsedSpritesIds(projectId: number): Observable<number[]> {
    return this.getScenesSpritesIds(projectId);
  }

  getUsedFrameIds(projectId: number): Observable<number[]> {
    return forkJoin({
      spritesIds: this.getSpritesFramesIds(projectId),
      gridsIds: this.getGridsFramesIds(projectId),
    }).pipe(
      map((values: { spritesIds: number[]; gridsIds: number[] }) => {
        return [...new Set([...values.gridsIds, ...values.spritesIds])];
      }),
    );
  }

  getScenesSpritesIds(projectId: number): Observable<number[]> {
    return this.dbScenes
      .getListByFilter((item: IScene) => item.projectId == projectId)
      .pipe(
        map((scenes: IScene[]) => {
          const framesIds = new Set<number>();
          for (const scene of scenes) {
            for (const layer of scene.layers) {
              if (layer.type === SceneLayerTypeEnum.Sprites) {
                for (const object of layer.objects) {
                  const sprite = object as ISceneObjectSprite;
                  if (sprite.referenceId) {
                    framesIds.add(sprite.referenceId);
                  }
                }
              }
            }
          }
          return Array.from(framesIds);
        }),
      );
  }

  getGridsFramesIds(projectId: number): Observable<number[]> {
    return this.dbGrid
      .getListByFilter((item: ITilesGrid) => item.projectId == projectId)
      .pipe(
        map((grids: ITilesGrid[]) => {
          const framesIds = new Set<number>();
          for (const grid of grids) {
            for (const item of grid.items) {
              framesIds.add(item.frameId);
            }
          }
          return Array.from(framesIds);
        }),
      );
  }

  getSpritesFramesIds(projectId: number): Observable<number[]> {
    return this.dbSprites
      .getListByFilter((item: ISprite) => item.projectId == projectId)
      .pipe(
        switchMap((sprites: ISprite[]) => {
          const framesIds = new Set<number>();
          for (const sprite of sprites) {
            for (const layer of sprite.layers) {
              for (const frame of layer.frames) {
                framesIds.add(frame.frameId);
              }
            }
          }
          return of(Array.from(framesIds));
        }),
      );
  }
}
