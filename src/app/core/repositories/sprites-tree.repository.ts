import { inject, Injectable } from '@angular/core';

import { BaseTreeRepository } from '~core/classes/base-tree.repository';
import { DBSpritesTree } from '~core/db';
import { SpritesTreeStore } from '~core/stores/sprites-tree.store';

@Injectable({
  providedIn: 'root',
})
export class SpritesTreeRepository extends BaseTreeRepository {
  protected readonly treeStore = inject(SpritesTreeStore);

  protected readonly dbTree = inject(DBSpritesTree);

  protected readonly storageKey = 'sprites-tree-selected-node';
}
