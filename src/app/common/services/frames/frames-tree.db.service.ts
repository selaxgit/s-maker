import { Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';

import { DBBase } from '../../classes';
import { IDBTreeItem, IFrame, ITreeItem } from '../../interfaces';
import { FramesDBService } from './frames.db.service';

@Injectable({ providedIn: 'root' })
export class FramesTreeDBService extends DBBase<IDBTreeItem> {
  protected readonly tableName = 'frames-tree';

  constructor(private readonly framesDBService: FramesDBService) {
    super();
  }

  public override remove(id: number): Observable<void> {
    return this.framesDBService
      .removeByFilter((item: IFrame) => item.treeId === id)
      .pipe(switchMap(() => super.remove(id)));
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
}
