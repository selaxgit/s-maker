import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, switchMap } from 'rxjs';

import { ISpriteFrame, IViewTile } from '../../interfaces';
import { SpriteFramesDBService } from './sprite-frames.db.service';

@Injectable({ providedIn: 'root' })
export class SpriteFramesService {
  constructor(private readonly spriteFramesDBService: SpriteFramesDBService) {}

  public insert(fields: Partial<ISpriteFrame>): Observable<ISpriteFrame> {
    return this.spriteFramesDBService.insert(fields);
  }

  public remove(id: number): Observable<void> {
    return this.spriteFramesDBService.remove(id);
  }

  public update(id: number, frame: Partial<ISpriteFrame>): Observable<ISpriteFrame> {
    return this.spriteFramesDBService.update(id, frame);
  }

  public addFrameFromCollection(
    projectId: number,
    spriteId: number,
    layerId: number,
    startIdxName: number,
    frames: IViewTile[],
  ): Observable<void> {
    return this.spriteFramesDBService.addFromCollection(projectId, spriteId, layerId, startIdxName, frames);
  }

  public addFrameFromFiles(
    projectId: number,
    spriteId: number,
    layerId: number,
    startIdxName: number,
    files: FileList,
  ): Observable<void | ISpriteFrame> {
    if (files.length === 1) {
      return this.spriteFramesDBService.addFromFile(projectId, spriteId, layerId, `Frame ${startIdxName}`, files[0]);
    }
    const forks: Observable<ISpriteFrame>[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const name = `Frame ${startIdxName}`;
      startIdxName++;
      forks.push(this.spriteFramesDBService.addFromFile(projectId, spriteId, layerId, name, file));
    }
    if (forks.length === 0) {
      return of(undefined);
    }
    return forkJoin(forks).pipe(switchMap(() => of(undefined)));
  }

  public fetchListByFilter(filter: (item: ISpriteFrame) => boolean): Observable<ISpriteFrame[]> {
    return this.spriteFramesDBService.getListByFilter(filter);
  }
}
