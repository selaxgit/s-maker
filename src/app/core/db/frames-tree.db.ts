import { inject, Injectable } from '@angular/core';
import { SUDBBase } from '@selax/utils';
import { Observable, switchMap } from 'rxjs';

import { IFrame } from '~core/interfaces';
import { IDBTreeItem } from '~interfaces/index';

import { DBFrames } from './frames.db';

@Injectable({ providedIn: 'root' })
export class DBFramesTree extends SUDBBase<IDBTreeItem> {
  protected readonly tableName = 'frames-tree';

  private readonly dbFrames = inject(DBFrames);

  override remove(id: number): Observable<void> {
    return this.dbFrames.removeByFilter((item: IFrame) => item.treeId === id).pipe(switchMap(() => super.remove(id)));
  }
}
