import { computed, signal } from '@angular/core';
import { SUJsonHelper } from '@selax/utils';
import { Subject } from 'rxjs';

import { TreeHelper } from '~helpers/tree.helper';
import { IDBTreeItem, ITreeItem, ITreeStore } from '~interfaces/tree.interface';

export abstract class BaseTreeStore implements ITreeStore {
  private readonly _tree = signal<ITreeItem[]>([]);

  private readonly _selectedNode = signal<ITreeItem | null>(null);

  readonly tree = this._tree.asReadonly();

  readonly selectedNode = this._selectedNode.asReadonly();

  readonly flatTree = computed(() => TreeHelper.treeToFlat(this._tree()));

  private readonly _expandNode = new Subject<number>();

  readonly expandNode$ = this._expandNode.asObservable();

  expandNode(id: number): void {
    this._expandNode.next(id);
  }

  setTree(tree: ITreeItem[]): void {
    this._tree.set(tree);
  }

  setSelectedNode(node: ITreeItem | null): void {
    this._selectedNode.set(node);
  }

  addTreeNode(node: ITreeItem, parentId: number | null = null): void {
    this._tree.update((tree: ITreeItem[]) => {
      if (!parentId) {
        tree.push(node);
      } else {
        const findNode = TreeHelper.findNode(parentId, tree);
        if (findNode) {
          findNode.children.push(node);
        }
      }
      return [...tree];
    });
  }

  updateTreeNode(id: number, fields: Partial<IDBTreeItem>): void {
    this._tree.update((tree: ITreeItem[]) => {
      const findNode = TreeHelper.findNode(id, tree);
      if (findNode) {
        Object.assign(findNode, fields);
      }
      return [...tree];
    });
  }

  moveNode(sourceId: number, parentId: number | null, idx: number = -1): void {
    this._tree.update((tree: ITreeItem[]) => {
      const sourceNode = TreeHelper.findNode(sourceId, tree, true);
      let children: ITreeItem[] | null = null;
      if (parentId === null) {
        children = this.tree();
      } else {
        const targetNode = TreeHelper.findNode(parentId, tree);
        if (targetNode) {
          children = targetNode.children;
        }
      }
      if (sourceNode && children) {
        sourceNode.parentId = parentId;
        if (idx < 0) {
          children.push(sourceNode);
        } else {
          children.splice(idx, 0, sourceNode);
        }
      }
      return SUJsonHelper.clone(tree);
    });
  }
}
