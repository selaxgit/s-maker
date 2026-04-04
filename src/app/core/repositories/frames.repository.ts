import { inject, Injectable } from '@angular/core';
import { SUFileHelper } from '@selax/utils';
import { from, lastValueFrom, Observable, of, switchMap, throwError } from 'rxjs';

import { DBFrames } from '~core/db';
import { UsedHelperService } from '~core/helpers';
import { IFrame, IViewTile } from '~core/interfaces';
import { FramesStore, ProjectStore } from '~core/stores';

@Injectable({
  providedIn: 'root',
})
export class FramesRepository {
  private readonly dbFrames = inject(DBFrames);

  private readonly framesStore = inject(FramesStore);

  private readonly projectStore = inject(ProjectStore);

  private readonly usedHelperService = inject(UsedHelperService);

  async removeDuplicates(
    callbackMessage: (message: string) => void,
    errorMessage: (message: string) => void,
  ): Promise<void> {
    const tilesIds = this.framesStore.tiles().map((i: IViewTile) => i.id);
    const framesList = await lastValueFrom(this.dbFrames.getListByFilter((item: IFrame) => tilesIds.includes(item.id)));
    const allCount = framesList.length;
    let frame;
    const removedIds: number[] = [];
    let idx = 1;
    while ((frame = framesList.shift())) {
      if (removedIds.includes(frame.id) || !frame.file) {
        continue;
      }
      callbackMessage(`Удаление дублей фреймов... (${idx} из ${allCount})`);
      for (const checkFrame of framesList) {
        if (removedIds.includes(checkFrame.id) || !checkFrame.file) {
          continue;
        }
        if (frame && checkFrame) {
          try {
            const compare = await SUFileHelper.compareFiles(frame.file, checkFrame.file);
            if (compare) {
              removedIds.push(checkFrame.id);
            }
          } catch (e: unknown) {
            if (e instanceof Error) {
              errorMessage(e.message || 'Ошибка сравнения фреймов');
            } else {
              errorMessage('Ошибка сравнения фреймов');
            }
            return;
          }
        }
      }
      idx++;
    }
    if (removedIds.length > 0) {
      this.framesStore.removeByIds(removedIds);
      await lastValueFrom(this.dbFrames.batchRemove(removedIds));
    }
  }

  removeNotUsedFrames(): Observable<void> {
    const ids = this.framesStore.removeNotUsedFrames();
    return this.dbFrames.batchRemove(ids);
  }

  addFrameFromFile(file: File, treeId: number | null): Observable<IFrame> {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      return throwError(() => new Error('Project ID не установлен для добавления фрейма'));
    }
    return this.dbFrames.add(projectId, treeId, file).pipe(
      switchMap((frame: IFrame) => {
        const tile: IViewTile = {
          id: frame.id,
          treeId: frame.treeId,
          name: frame.name,
          tooltip: `${frame.id}: ${frame.name} (${frame.width}x${frame.height})`,
          objectURL: frame.file ? URL.createObjectURL(frame.file) : '',
          fileWidth: frame.width,
          fileHeight: frame.height,
          used: false,
          selected: false,
        };
        this.framesStore.addTile(tile);
        return of(frame);
      }),
    );
  }

  updateFrameTreeId(id: number, treeId: number | null): Observable<void> {
    this.framesStore.updateTileTreeId(id, treeId);
    return this.dbFrames.update(id, { treeId }).pipe(switchMap(() => of(void 0)));
  }

  updateFrame(id: number, fields: Partial<IFrame>): Observable<void> {
    return this.dbFrames.update(id, fields).pipe(
      switchMap((frame: IFrame) => {
        this.framesStore.updateTile({
          id: frame.id,
          treeId: frame.treeId,
          name: frame.name,
          tooltip: `${frame.id}: ${frame.name} (${frame.width}x${frame.height})`,
          objectURL: frame.file ? URL.createObjectURL(frame.file) : '',
        });
        return of(void 0);
      }),
    );
  }

  removeFrame(id: number): Observable<void> {
    return this.dbFrames.remove(id).pipe(
      switchMap(() => {
        this.framesStore.removeTile(id);
        return of(void 0);
      }),
    );
  }

  fetchFrameById(id: number): Observable<IFrame> {
    return this.dbFrames.get(id);
  }

  fetchFrames(projectId: number): Observable<void> {
    return this.dbFrames
      .getListByFilter((item: IFrame) => item.projectId == projectId)
      .pipe(switchMap((frames: IFrame[]) => from(this.framesListToTiles(frames))));
  }

  reset(): void {
    this.framesStore.setTiles([]);
  }

  private async framesListToTiles(frames: IFrame[]): Promise<void> {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      throw new Error('Project ID не установлен для маппинга фреймов');
    }
    const usedFrameIds = await lastValueFrom(this.usedHelperService.getUsedFrameIds(projectId));
    const tiles = frames.map((frame: IFrame) => ({
      id: frame.id,
      treeId: frame.treeId,
      name: frame.name,
      tooltip: `${frame.id}: ${frame.name} (${frame.width}x${frame.height})`,
      objectURL: frame.file ? URL.createObjectURL(frame.file) : '',
      used: usedFrameIds.includes(frame.id),
      selected: false,
    })) as IViewTile[];
    this.framesStore.setTiles(tiles);
  }
}
