import { Observable } from 'rxjs';

import { ITreeItem } from '../../interfaces';

export interface ITreeService {
  fetchTreeList: (projectId: number) => Observable<ITreeItem[]>;
  addTreeNode: (projectId: number, name: string, parentId: number | null) => Observable<ITreeItem>;
  updateTreeNode: (id: number, name: string, parentId: number | null) => Observable<void>;
  removeTreeNode: (id: number) => Observable<void>;
  reOrderTreeNode: (tree: ITreeItem[]) => Observable<void>;
}
