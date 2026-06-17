import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';

import { SMCTreeSection } from '~components/tree-section';
import { SpritesFacade } from '~core/facade';
import { BreadcrumbsStore } from '~core/stores';
import { SpritesTreeStore } from '~core/stores/sprites-tree.store';
import { TREE_FRAMES_SERVICE_TOKEN, TREE_FRAMES_STORE_TOKEN } from '~tokens/tree.tokens';

@Component({
  selector: 'sc-sprites-tree',
  imports: [SMCTreeSection],
  templateUrl: './sprites-tree.html',
  styleUrl: './sprites-tree.scss',
  providers: [
    { provide: TREE_FRAMES_STORE_TOKEN, useExisting: SpritesTreeStore },
    { provide: TREE_FRAMES_SERVICE_TOKEN, useExisting: SpritesFacade },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SCSpritesTree {
  private readonly spritesTreeStore = inject(SpritesTreeStore);

  private readonly breadcrumbsStore = inject(BreadcrumbsStore);

  constructor() {
    effect(() => {
      const selectedNode = this.spritesTreeStore.selectedNode();
      this.breadcrumbsStore.setPage(selectedNode?.name ?? null);
    });
  }
}
