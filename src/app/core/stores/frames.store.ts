import { inject, Injectable } from '@angular/core';

import { BaseTilesStore } from '~core/classes/base-tiles.store';

import { FramesTreeStore } from './frames-tree.store';

@Injectable({
  providedIn: 'root',
})
export class FramesStore extends BaseTilesStore {
  protected readonly treeStore = inject(FramesTreeStore);
}
