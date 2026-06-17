import { effect, inject } from '@angular/core';
import { SUDBBase, SUSessionStorageService } from '@selax/utils';
import { forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';

import { ProjectStore } from '~core/stores';
import { TreeHelper } from '~helpers/tree.helper';
import { IDBTreeItem, ITreeItem } from '~interfaces/tree.interface';

import { BaseTreeStore } from './base-tree.store';

export abstract class BaseTreeRepository {
  protected abstract readonly treeStore: BaseTreeStore;

  protected abstract readonly dbTree: SUDBBase<IDBTreeItem>;

  protected abstract readonly storageKey: string;

  protected readonly projectStore = inject(ProjectStore);

  protected readonly sessionStorageService = inject(SUSessionStorageService);

  protected fetchedTree = false;

  constructor() {
    effect(() => {
      const selectedNode = this.treeStore.selectedNode();
      if (this.fetchedTree) {
        this.saveNodeToStorage(selectedNode);
      }
    });
  }

  updateTreeNode(id: number, fields: Partial<IDBTreeItem>): Observable<void> {
    this.treeStore.updateTreeNode(id, fields);
    return this.dbTree.update(id, fields).pipe(switchMap(() => of(void 0)));
  }

  removeTreeNode(id: number): Observable<number[]> {
    if (id === this.treeStore.selectedNode()?.id) {
      this.treeStore.setSelectedNode(null);
    }
    let ids: number[] = [];
    const removeNode = TreeHelper.findNode(id, this.treeStore.tree());
    if (removeNode) {
      ids = TreeHelper.collectIdsNodes(removeNode.children);
    }
    const forkJobs = [this.dbTree.remove(id), ...ids.map((nodeId: number) => this.dbTree.remove(nodeId))];
    return forkJoin(forkJobs).pipe(
      switchMap(() => {
        const tree = TreeHelper.removeNode(id, this.treeStore.tree());
        this.treeStore.setTree([...tree]);
        return of([id, ...ids]);
      }),
    );
  }

  addTreeNode(name: string, parentId: number | null = null): Observable<ITreeItem> {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      return throwError(() => new Error('Project ID не установлен для addTreeNode'));
    }
    return this.dbTree.insert({ name, parentId: parentId ?? null, projectId, order: 0 }).pipe(
      map((fields: IDBTreeItem) => {
        const node: ITreeItem = { ...fields, children: [] };
        this.treeStore.addTreeNode(node, parentId);
        this.treeStore.setSelectedNode(node);
        return node;
      }),
    );
  }

  fetchTree(projectId: number): Observable<void> {
    return this.dbTree
      .getListByFilter((item: IDBTreeItem) => item.projectId == projectId)
      .pipe(
        switchMap((frames: IDBTreeItem[]) => {
          const tree = TreeHelper.flatToTree(frames);
          TreeHelper.orderItems(tree);
          this.treeStore.setTree(tree);
          this.fetchedTree = true;
          this.loadNodeFromStorage(frames);
          return of(void 0);
        }),
      );
  }

  reset(): void {
    this.fetchedTree = false;
    this.treeStore.setTree([]);
    this.treeStore.setSelectedNode(null);
  }

  private saveNodeToStorage(item: IDBTreeItem | null): void {
    const key = this.getStorageKey();
    if (item) {
      this.sessionStorageService.set(key, item);
    } else {
      this.sessionStorageService.remove(key);
    }
  }

  private loadNodeFromStorage(items: IDBTreeItem[]): void {
    const key = this.getStorageKey();
    const node = this.sessionStorageService.get<ITreeItem>(key);
    if (node) {
      if (items.some((item: IDBTreeItem) => item.id === node.id)) {
        this.treeStore.setSelectedNode(node);
        this.treeStore.expandNode(node.id);
      } else {
        this.sessionStorageService.remove(key);
      }
    }
  }

  private getStorageKey(): string {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      throw new Error('Project ID не установлен для getStorageKey');
    }
    return `${this.storageKey}-${projectId}`;
  }
}
