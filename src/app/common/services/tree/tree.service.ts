import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, switchMap } from 'rxjs';

import { DBBase } from '../../classes';
import { TransformHelper } from '../../helpers';
import { IDBTreeItem, ITreeItem } from '../../interfaces';
import { ITreeService } from './interfaces';

@Injectable()
export class TreeService implements ITreeService {
  private dbTreeService!: DBBase<IDBTreeItem>;

  public reOrderTreeNode(tree: ITreeItem[]): Observable<void> {
    const flatTree = TransformHelper.treeToFlat(tree, true);
    const forks: Observable<IDBTreeItem>[] = [];
    flatTree.forEach((item: IDBTreeItem) => {
      forks.push(this.dbTreeService.update(item.id, { order: item.order, parentId: item.parentId }));
    });
    if (forks.length === 0) {
      return of(undefined);
    }
    return forkJoin(forks).pipe(switchMap(() => of(undefined)));
  }

  public removeTreeNode(id: number): Observable<void> {
    return this.dbTreeService.remove(id);
  }

  public updateTreeNode(id: number, name: string, parentId: number | null): Observable<void> {
    return this.dbTreeService.update(id, { name, parentId }).pipe(switchMap(() => of(undefined)));
  }

  public addTreeNode(projectId: number, name: string, parentId: number | null): Observable<ITreeItem> {
    return this.dbTreeService
      .insert({ projectId, name, parentId, order: 0 })
      .pipe(switchMap((node: IDBTreeItem) => of({ ...node, children: [] })));
  }

  public fetchTreeList(projectId: number): Observable<ITreeItem[]> {
    return this.dbTreeService
      .getListByFilter((item: IDBTreeItem) => item.projectId === projectId)
      .pipe(
        switchMap((tree: IDBTreeItem[]) => {
          return of(TransformHelper.flatToTree(tree));
        }),
      );
  }

  public setBaseService(dbTreeService: DBBase<IDBTreeItem>): void {
    this.dbTreeService = dbTreeService;
  }
}
