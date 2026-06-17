import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';

import { SMCTreeSection } from '~components/tree-section';
import { FramesFacade } from '~core/facade';
import { BreadcrumbsStore, FramesTreeStore } from '~core/stores';
import { TREE_FRAMES_SERVICE_TOKEN, TREE_FRAMES_STORE_TOKEN } from '~tokens/tree.tokens';

@Component({
  selector: 'fc-frames-tree',
  imports: [SMCTreeSection],
  templateUrl: './frames-tree.html',
  styleUrl: './frames-tree.scss',
  providers: [
    { provide: TREE_FRAMES_STORE_TOKEN, useExisting: FramesTreeStore },
    { provide: TREE_FRAMES_SERVICE_TOKEN, useExisting: FramesFacade },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FCFramesTree {
  private readonly framesTreeStore = inject(FramesTreeStore);

  private readonly breadcrumbsStore = inject(BreadcrumbsStore);

  constructor() {
    effect(() => {
      const selectedNode = this.framesTreeStore.selectedNode();
      this.breadcrumbsStore.setPage(selectedNode?.name ?? null);
    });
  }
}
