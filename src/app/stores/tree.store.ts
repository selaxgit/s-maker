import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { BehaviorSubject, finalize, switchMap } from 'rxjs';

import { ITreeItem } from '../common/interfaces';
import { SessionStorageService } from '../common/services/common';
import { ITreeService } from '../common/services/tree';

export interface TreeState {
  tree: ITreeItem[];
  selectedNode: ISelectedNode | null;
}

export interface ITreeStorePayload {
  projectId: number;
  treeService: ITreeService;
  storageKey?: string;
}

export interface IAddNodePayload extends ITreeStorePayload {
  name: string;
  parentId: number | null;
}

export interface IUpdateNodePayload extends ITreeStorePayload {
  id: number;
  parentId: number | null;
  name: string;
}

export interface IRemoveNodePayload extends ITreeStorePayload {
  id: number;
  done: () => void;
}

export interface IReOrderNodePayload extends ITreeStorePayload {
  children: ITreeItem[];
}

export interface ISelectedNode {
  id: number;
  parentId: number | null;
  name: string;
}

export interface ISelectedNodePayload {
  projectId: number;
  storageKey?: string;
  node: ISelectedNode | null;
}

const initialState: TreeState = {
  tree: [],
  selectedNode: null,
};

@Injectable()
export class TreeStore extends ComponentStore<TreeState> {
  private isLoading = new BehaviorSubject<boolean>(false);

  readonly isLoading$ = this.isLoading.asObservable();

  readonly tree$ = this.select((state: TreeState) => state.tree);

  readonly selectedNode$ = this.select((state: TreeState) => state.selectedNode);

  constructor(private readonly sessionStorageService: SessionStorageService) {
    super(initialState);
  }

  public selectNode(payload: ISelectedNodePayload): void {
    this.patchState({ selectedNode: payload.node });
    if (payload.storageKey) {
      this.saveSelectByStorage(payload.projectId, payload.storageKey);
    }
  }

  public reOrderNodeEvent(payload: IReOrderNodePayload): void {
    this.isLoading.next(true);
    payload.treeService
      .reOrderTreeNode(payload.children)
      .pipe(
        switchMap(() => {
          return payload.treeService.fetchTreeList(payload.projectId);
        }),
        finalize(() => this.isLoading.next(false)),
      )
      .subscribe((tree: ITreeItem[]) => this.patchState({ tree }));
  }

  public removeTreeNode(payload: IRemoveNodePayload): void {
    this.isLoading.next(true);
    payload.treeService
      .removeTreeNode(payload.id)
      .pipe(
        switchMap(() => {
          if (this.get().selectedNode?.id === payload.id) {
            this.patchState({
              selectedNode: null,
            });
          }
          return payload.treeService.fetchTreeList(payload.projectId);
        }),
        finalize(() => {
          this.isLoading.next(false);
          payload.done();
        }),
      )
      .subscribe((tree: ITreeItem[]) => this.patchState({ tree }));
  }

  public updateTreeNode(payload: IUpdateNodePayload): void {
    this.isLoading.next(true);
    payload.treeService
      .updateTreeNode(payload.id, payload.name, payload.parentId)
      .pipe(
        switchMap(() => {
          this.patchState({
            selectedNode: {
              id: payload.id,
              parentId: payload.parentId,
              name: payload.name,
            },
          });
          return payload.treeService.fetchTreeList(payload.projectId);
        }),
        finalize(() => this.isLoading.next(false)),
      )
      .subscribe((tree: ITreeItem[]) => this.patchState({ tree }));
  }

  public addTreeNode(payload: IAddNodePayload): void {
    this.isLoading.next(true);
    payload.treeService
      .addTreeNode(payload.projectId, payload.name, payload.parentId)
      .pipe(
        switchMap((treeItem: ITreeItem) => {
          this.patchState({
            selectedNode: {
              id: treeItem.id,
              parentId: treeItem.parentId,
              name: treeItem.name,
            },
          });
          return payload.treeService.fetchTreeList(payload.projectId);
        }),
        finalize(() => this.isLoading.next(false)),
      )
      .subscribe((tree: ITreeItem[]) => this.patchState({ tree }));
  }

  public fetchTreeList(payload: ITreeStorePayload): void {
    this.isLoading.next(true);
    payload.treeService
      .fetchTreeList(payload.projectId)
      .pipe(finalize(() => this.isLoading.next(false)))
      .subscribe((tree: ITreeItem[]) => {
        // Сперва выбрали ноду, потом обновили дерево.
        // Иначе дерево в компоненте не раскроется, если выбранная нода child
        this.selectByStorage(payload.projectId, payload.storageKey, tree);
        this.patchState({ tree });
      });
  }

  private selectByStorage(projectId: number, storageKey: string | undefined, tree: ITreeItem[]): void {
    if (!storageKey) {
      return;
    }
    const key = this.getStorageKey(projectId, storageKey);
    const selectedNode = this.sessionStorageService.get<ITreeItem>(key);
    if (selectedNode) {
      if (this.findIdInTree(selectedNode.id, tree)) {
        this.patchState({ selectedNode });
      } else {
        this.patchState({ selectedNode: null });
        this.sessionStorageService.remove(key);
      }
    }
  }

  private saveSelectByStorage(projectId: number, storageKey: string): void {
    const key = this.getStorageKey(projectId, storageKey);
    const node = this.get().selectedNode;
    if (node) {
      this.sessionStorageService.set(key, node);
    } else {
      this.sessionStorageService.remove(key);
    }
  }

  private getStorageKey(projectId: number, storageKey: string): string {
    return `${storageKey}:${projectId}`;
  }

  private findIdInTree(id: number, tree: ITreeItem[]): boolean {
    const findTree = (values: ITreeItem[]): boolean => {
      for (const item of values) {
        if (item.id === id) {
          return true;
        }
        const inChild = findTree(item.children);
        if (inChild) {
          return true;
        }
      }
      return false;
    };
    return findTree(tree);
  }
}
