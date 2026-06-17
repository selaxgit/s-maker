import { inject, Injectable } from '@angular/core';

import { BaseTilesStore } from '~core/classes/base-tiles.store';

import { SpritesTreeStore } from './sprites-tree.store';

@Injectable({
  providedIn: 'root',
})
export class SpritesStore extends BaseTilesStore {
  protected readonly treeStore = inject(SpritesTreeStore);
}
