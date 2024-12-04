import { Injectable } from '@angular/core';
import { firstValueFrom, forkJoin, from, map, Observable, of, switchMap } from 'rxjs';

import { FileHelper } from '../../helpers';
import { IDBTreeItem, IFrame, ITreeItem, IViewTile } from '../../interfaces';
import { FrameTilesCacheService } from './frame-tiles.cache.service';
import { FramesDBService } from './frames.db.service';
import { FramesTreeDBService } from './frames-tree.db.service';

@Injectable({ providedIn: 'root' })
export class FramesService {
  constructor(
    private readonly framesDBService: FramesDBService,
    private readonly framesTreeDBService: FramesTreeDBService,
    private readonly frameTilesCacheService: FrameTilesCacheService,
  ) {}

  public getFramesTree(filter: (item: IDBTreeItem) => boolean): Observable<ITreeItem[]> {
    return this.framesTreeDBService.getListWithChild(filter);
  }

  public removeDuplicatesTiles(frames: IViewTile[], callbackMessage: (message: string) => void): Observable<void> {
    return from(this.doRemoveDuplicates(frames, callbackMessage));
  }

  public update(id: number, frame: Partial<IFrame>): Observable<IFrame> {
    return this.framesDBService.update(id, frame);
  }

  public batchRemove(ids: number[]): Observable<void> {
    return this.framesDBService.batchRemove(ids).pipe(
      switchMap(() => {
        this.frameTilesCacheService.batchRemoveCache(ids);
        return of(undefined);
      }),
    );
  }

  public remove(id: number): Observable<void> {
    return this.framesDBService.remove(id).pipe(
      switchMap(() => {
        this.frameTilesCacheService.removeCache(id);
        return of(undefined);
      }),
    );
  }

  public addFromFiles(projectId: number, treeId: number | null, files: FileList): Observable<void> {
    const forks: Observable<IFrame>[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (file) {
        forks.push(this.framesDBService.add(projectId, treeId, file));
      }
    }
    if (forks.length === 0) {
      return of(undefined);
    }
    return forkJoin(forks).pipe(switchMap(() => of(undefined)));
  }

  public add(projectId: number, treeId: number | null, file: File, name: string | null = null): Observable<IFrame> {
    return this.framesDBService.add(projectId, treeId, file, name);
  }

  public fetchTiles(projectId: number, treeId: number | null): Observable<IViewTile[]> {
    return this.framesDBService
      .getListByFilter((item: IFrame) => item.projectId === projectId && item.treeId === treeId)
      .pipe(
        switchMap((frames: IFrame[]) => from(this.frameTilesCacheService.getCacheByItems(frames))),
        map((tiles: IViewTile[]) =>
          tiles.map((i: IViewTile) => {
            // eslint-disable-next-line unused-imports/no-unused-vars
            const { selected, ...tile } = i;
            return tile;
          }),
        ),
      );
  }

  public fetchTilesByFilter(filter: (item: IFrame) => boolean): Observable<IViewTile[]> {
    return this.framesDBService.getListByFilter(filter).pipe(
      switchMap((frames: IFrame[]) => from(this.frameTilesCacheService.getCacheByItems(frames))),
      map((tiles: IViewTile[]) =>
        tiles.map((i: IViewTile) => {
          // eslint-disable-next-line unused-imports/no-unused-vars
          const { selected, ...tile } = i;
          return tile;
        }),
      ),
    );
  }

  public fetchTilesByProject(projectId: number): Observable<IViewTile[]> {
    return this.framesDBService
      .getListByFilter((item: IFrame) => item.projectId === projectId)
      .pipe(
        switchMap((frames: IFrame[]) => from(this.frameTilesCacheService.getCacheByItems(frames))),
        map((tiles: IViewTile[]) =>
          tiles.map((i: IViewTile) => {
            // eslint-disable-next-line unused-imports/no-unused-vars
            const { selected, ...tile } = i;
            return tile;
          }),
        ),
      );
  }

  public fetchTileById(id: number): Observable<IViewTile> {
    return this.framesDBService
      .get(id)
      .pipe(switchMap((frame: IFrame) => from(this.frameTilesCacheService.getCache(frame))));
  }

  public fetchByFilter(filter: (item: IFrame) => boolean): Observable<IFrame[]> {
    return this.framesDBService.getListByFilter(filter);
  }

  public clearCache(): void {
    this.frameTilesCacheService.clear();
  }

  public clearCacheById(id: number): void {
    this.frameTilesCacheService.clearCacheById(id);
  }

  private async doRemoveDuplicates(tiles: IViewTile[], callbackMessage: (message: string) => void): Promise<void> {
    const tilesList = [...tiles];
    let tile;
    const ids: number[] = [];
    let idx = 1;
    while ((tile = tilesList.shift())) {
      if (ids.includes(tile.id) || !tile.file) {
        continue;
      }
      callbackMessage(`Удаление дублей фреймов... (${idx} из ${frames.length})`);
      for (const checkTile of tilesList) {
        if (ids.includes(checkTile.id) || !checkTile.file) {
          continue;
        }
        if (tile && checkTile) {
          const compare = await FileHelper.compareFiles(tile.file, checkTile.file);
          if (compare) {
            ids.push(checkTile.id);
          }
        }
      }
      idx++;
    }
    if (ids.length > 0) {
      await firstValueFrom(this.batchRemove([...new Set(ids)]));
    }
  }
}
