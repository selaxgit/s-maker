import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { DBBase } from '../../classes';
import { IDBTreeItem, ISprite, ITreeItem } from '../../interfaces';
import { SpritesDBService } from './sprites.db.service';

@Injectable({ providedIn: 'root' })
export class SpritesTreeDBService extends DBBase<IDBTreeItem> {
  protected readonly tableName = 'sprites-tree';

  constructor(private readonly spritesDBService: SpritesDBService) {
    super();
  }

  public getListWithChild(filter: (item: IDBTreeItem) => boolean): Observable<ITreeItem[]> {
    const getChildren = (parentId: number, list: IDBTreeItem[]): ITreeItem[] => {
      const ret: ITreeItem[] = [];
      list
        .filter((i: IDBTreeItem) => i.parentId === parentId)
        .forEach((i: IDBTreeItem, idx: number) => {
          ret.push({
            ...i,
            order: i.order !== undefined ? i.order : idx,
            children: getChildren(i.id, list),
          });
        });
      ret.sort((a: IDBTreeItem, b: IDBTreeItem) => Number(a.order) - Number(b.order));
      return ret;
    };

    return this.getListByFilter(filter).pipe(
      map((response: IDBTreeItem[]) => {
        const tree: ITreeItem[] = [];
        response
          .filter((i: IDBTreeItem) => !i.parentId)
          .forEach((i: IDBTreeItem, idx: number) => {
            tree.push({
              ...i,
              order: i.order !== undefined ? i.order : idx,
              children: getChildren(i.id, response),
            });
          });
        return tree;
      }),
    );
  }

  public override remove(id: number): Observable<void> {
    return this.spritesDBService
      .getListByFilter((item: ISprite) => item.treeId === id)
      .pipe(
        switchMap((sprites: ISprite[]) => {
          const forks: Observable<void>[] = [];
          sprites.forEach((sprite: ISprite) => {
            forks.push(this.spritesDBService.remove(sprite.id));
          });
          if (forks.length === 0) {
            return of(undefined);
          }
          return forkJoin(forks);
        }),
        switchMap(() => super.remove(id)),
      );
  }
}
