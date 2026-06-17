import { Signal } from '@angular/core';
import { Observable } from 'rxjs';

export interface IDBTreeItem {
  id: number;
  projectId: number;
  parentId: number | null;
  name: string;
  order: number;
}

export interface ITreeItem extends IDBTreeItem {
  children: ITreeItem[];
}

export interface ITreeService {
  addTreeNode: (name: string, parentId?: number | null) => Observable<ITreeItem>;
  removeTreeNode: (id: number) => Observable<number[]>;
  updateTreeNode: (id: number, fields: Partial<IDBTreeItem>) => Observable<void>;
  selectedNode: (node: ITreeItem | null) => void;
  moveNode: (sourceId: number, parentId: number | null, idx?: number) => Promise<void>;
  moveTileToNode: (nodeId: number, tileId: number) => void;
  isCanRemove: (node: ITreeItem) => boolean;
}

export interface ITreeStore {
  tree: Signal<ITreeItem[]>;
  selectedNode: Signal<ITreeItem | null>;
  expandNode$: Observable<number>;
  expandNode: (id: number) => void;
}
