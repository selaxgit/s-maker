import { inject, Injectable } from '@angular/core';

import { BaseTreeRepository } from '~core/classes/base-tree.repository';
import { DBFramesTree } from '~core/db';
import { FramesTreeStore } from '~core/stores';

@Injectable({
  providedIn: 'root',
})
export class FramesTreeRepository extends BaseTreeRepository {
  protected readonly treeStore = inject(FramesTreeStore);

  protected readonly dbTree = inject(DBFramesTree);

  protected readonly storageKey = 'frames-tree-selected-node';
}
