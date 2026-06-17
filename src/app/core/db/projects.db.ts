import { inject, Injectable } from '@angular/core';
import { SUDBBase } from '@selax/utils';
import { forkJoin, Observable, switchMap } from 'rxjs';

import { IProject } from '~core/interfaces';

import { DBFrames } from './frames.db';
import { DBFramesTree } from './frames-tree.db';
import { DBGrid } from './grid.db';
import { DBScenes } from './scenes.db';
import { DBSprites } from './sprites.db';
import { DBSpritesTree } from './sprites-tree.db';

@Injectable({ providedIn: 'root' })
export class DBProjects extends SUDBBase<IProject> {
  protected readonly tableName = 'projects';

  private readonly dbFramesTree = inject(DBFramesTree);

  private readonly dbFrames = inject(DBFrames);

  private readonly dbSpritesTree = inject(DBSpritesTree);

  private readonly dbSprites = inject(DBSprites);

  private readonly dbGrid = inject(DBGrid);

  private readonly dbScenes = inject(DBScenes);

  public override remove(id: number): Observable<void> {
    return forkJoin([
      this.dbFramesTree.removeByFilter((item: { projectId: number }) => item.projectId === id),
      this.dbFrames.removeByFilter((item: { projectId: number }) => item.projectId === id),
      this.dbSpritesTree.removeByFilter((item: { projectId: number }) => item.projectId === id),
      this.dbSprites.removeByFilter((item: { projectId: number }) => item.projectId === id),
      this.dbGrid.removeByFilter((item: { projectId: number }) => item.projectId === id),
      this.dbScenes.removeByFilter((item: { projectId: number }) => item.projectId === id),
    ]).pipe(switchMap(() => super.remove(id)));
  }
}
