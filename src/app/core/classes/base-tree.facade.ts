import { SUJsonHelper } from '@selax/utils';
import { lastValueFrom, Observable } from 'rxjs';

import { TreeHelper } from '~helpers/tree.helper';
import { IDBTreeItem, ITreeItem, ITreeService } from '~interfaces/tree.interface';

import { BaseTreeRepository } from './base-tree.repository';
import { BaseTreeStore } from './base-tree.store';

export abstract class BaseTreeFacade implements ITreeService {
  protected abstract readonly treeRepository: BaseTreeRepository;

  protected abstract readonly treeStore: BaseTreeStore;

  abstract moveTileToNode(nodeId: number, tileId: number): void;

  abstract isCanRemove(node: ITreeItem): boolean;

  async moveNode(sourceId: number, parentId: number | null, idx: number = -1): Promise<void> {
    this.treeStore.moveNode(sourceId, parentId, idx);
    const cloneTree = SUJsonHelper.clone(this.treeStore.tree());
    TreeHelper.reOrderItems(cloneTree);
    const flatTree = TreeHelper.treeToFlat(cloneTree);
    for (const item of flatTree) {
      await lastValueFrom(this.updateTreeNode(item.id, { parentId: item.parentId, order: item.order }));
    }
  }

  selectedNode(node: ITreeItem | null): void {
    this.treeStore.setSelectedNode(node);
  }

  addTreeNode(name: string, parentId?: number | null): Observable<ITreeItem> {
    return this.treeRepository.addTreeNode(name, parentId);
  }

  removeTreeNode(id: number): Observable<number[]> {
    return this.treeRepository.removeTreeNode(id);
  }

  updateTreeNode(id: number, fields: Partial<IDBTreeItem>): Observable<void> {
    return this.treeRepository.updateTreeNode(id, fields);
  }

  fetchTree(projectId: number): Observable<void> {
    return this.treeRepository.fetchTree(projectId);
  }

  reset(): void {
    this.treeRepository.reset();
  }
}
