import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { DBBase } from '../../classes';
import { IFrame, ISpriteFrame, IViewTile } from '../../interfaces';
import { FramesDBService } from '../frames';

@Injectable({ providedIn: 'root' })
export class SpriteFramesDBService extends DBBase<ISpriteFrame> {
  protected readonly tableName = 'sprites-frames';

  constructor(private readonly framesDBService: FramesDBService) {
    super();
  }

  public override getListByFilter(filter: (item: ISpriteFrame) => boolean): Observable<ISpriteFrame[]> {
    return this.getList().pipe(
      map((response: ISpriteFrame[]) => response.filter((item: ISpriteFrame) => filter(item))),
      switchMap((spriteFrames: ISpriteFrame[]) => {
        const ids = spriteFrames.map((i: ISpriteFrame) => i.frameId);
        return this.framesDBService
          .getListByFilter((f: IFrame) => ids.includes(f.id))
          .pipe(
            map((frames: IFrame[]) => {
              const store: { [key: number]: File } = {};
              for (const frame of frames) {
                store[frame.id] = frame.file;
              }
              for (const frame of spriteFrames) {
                frame.file = store[frame.frameId];
              }
              return spriteFrames;
            }),
          );
      }),
    );
  }

  public addFromCollection(
    projectId: number,
    spriteId: number,
    layerId: number,
    startIdxName: number,
    frames: IViewTile[],
  ): Observable<void> {
    const forks: Observable<ISpriteFrame>[] = [];
    frames.forEach((frame: IViewTile) => {
      forks.push(
        this.insert({
          projectId,
          spriteId,
          layerId,
          frameId: frame.id,
          name: `Frame ${startIdxName}`,
          x: 0,
          y: 0,
          width: frame.width,
          height: frame.height,
          visible: true,
          zIndex: 0,
        }),
      );
      startIdxName++;
    });
    if (forks.length === 0) {
      return of(undefined);
    }
    return forkJoin(forks).pipe(switchMap(() => of(undefined)));
  }

  public addFromFile(
    projectId: number,
    spriteId: number,
    layerId: number,
    name: string,
    file: File,
  ): Observable<ISpriteFrame> {
    return this.framesDBService.add(projectId, null, file).pipe(
      switchMap((frame: IFrame) =>
        this.insert({
          projectId,
          spriteId,
          layerId,
          frameId: frame.id,
          name,
          x: 0,
          y: 0,
          width: frame.width,
          height: frame.height,
          visible: true,
          zIndex: 0,
        }),
      ),
    );
  }
}
