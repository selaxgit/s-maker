import { inject, Injectable } from '@angular/core';
import { lastValueFrom, Observable, tap } from 'rxjs';

import { BaseTreeFacade } from '~core/classes/base-tree.facade';
import { UsedHelperService } from '~core/helpers';
import { ISprite } from '~core/interfaces';
import { SpritesRepository } from '~core/repositories';
import { SpritesTreeRepository } from '~core/repositories/sprites-tree.repository';
import { ProjectStore } from '~core/stores';
import { SpritesStore } from '~core/stores/sprites.store';
import { SpritesTreeStore } from '~core/stores/sprites-tree.store';
import { TreeHelper } from '~helpers/tree.helper';
import { ITreeItem } from '~interfaces/tree.interface';

import { FramesFacade } from './frames.facade';

@Injectable({
  providedIn: 'root',
})
export class SpritesFacade extends BaseTreeFacade {
  protected readonly treeRepository = inject(SpritesTreeRepository);

  protected readonly treeStore = inject(SpritesTreeStore);

  protected readonly spritesRepository = inject(SpritesRepository);

  private readonly spritesStore = inject(SpritesStore);

  private readonly framesFacade = inject(FramesFacade);

  private readonly projectStore = inject(ProjectStore);

  private readonly usedHelperService = inject(UsedHelperService);

  async updateUsedFrames(): Promise<void> {
    const usedSpritesIds = await lastValueFrom(
      this.usedHelperService.getUsedSpritesIds(this.projectStore.project()!.id),
    );
    this.spritesStore.updateUsedFrames(usedSpritesIds);
  }

  removeSprite(spriteId: number): Observable<void> {
    return this.spritesRepository.removeSprite(spriteId).pipe(
      tap(() => {
        this.framesFacade.updateUsedFrames();
      }),
    );
  }

  fetchSpriteById(id: number): Observable<ISprite> {
    return this.spritesRepository.fetchSpriteById(id);
  }

  fetchSprites(projectId: number): Observable<void> {
    return this.spritesRepository.fetchSprites(projectId);
  }

  moveTileToNode(nodeId: number, tileId: number): void {
    lastValueFrom(this.spritesRepository.updateSpriteTreeId(tileId, nodeId)).catch((e: unknown) => {
      console.error('Error moving sprite to node', e);
    });
  }

  isCanRemove(node: ITreeItem): boolean {
    const ids = TreeHelper.collectIdsNodes(node.children);
    return this.spritesStore.canRemoveTilesByTreeIds([node.id, ...ids]);
  }

  override reset(): void {
    super.reset();
    this.spritesRepository.reset();
  }
}
