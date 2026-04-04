import { inject, Injectable } from '@angular/core';
import { SUDBBase } from '@selax/utils';
import { Observable, switchMap } from 'rxjs';

import { ISprite } from '~core/interfaces';
import { IDBTreeItem } from '~interfaces/tree.interface';

import { DBSprites } from './sprites.db';

@Injectable({ providedIn: 'root' })
export class DBSpritesTree extends SUDBBase<IDBTreeItem> {
  protected readonly tableName = 'sprites-tree';

  private readonly dbSprites = inject(DBSprites);

  override remove(id: number): Observable<void> {
    return this.dbSprites.removeByFilter((item: ISprite) => item.treeId === id).pipe(switchMap(() => super.remove(id)));
  }
}
