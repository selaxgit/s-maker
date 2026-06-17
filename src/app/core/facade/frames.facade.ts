import { inject, Injectable } from '@angular/core';
import { from, lastValueFrom, Observable } from 'rxjs';

import { BaseTreeFacade } from '~core/classes/base-tree.facade';
import { UsedHelperService } from '~core/helpers';
import { IFrame } from '~core/interfaces';
import { FramesRepository, FramesTreeRepository } from '~core/repositories';
import { FramesStore, FramesTreeStore, ProjectStore } from '~core/stores';
import { TreeHelper } from '~helpers/tree.helper';
import { ITreeItem } from '~interfaces/tree.interface';

@Injectable({
  providedIn: 'root',
})
export class FramesFacade extends BaseTreeFacade {
  protected readonly treeRepository = inject(FramesTreeRepository);

  protected readonly treeStore = inject(FramesTreeStore);

  private readonly framesRepository = inject(FramesRepository);

  private readonly framesStore = inject(FramesStore);

  private readonly projectStore = inject(ProjectStore);

  private readonly usedHelperService = inject(UsedHelperService);

  async updateUsedFrames(): Promise<void> {
    const usedFrameIds = await lastValueFrom(this.usedHelperService.getUsedFrameIds(this.projectStore.project()!.id));
    this.framesStore.updateUsedFrames(usedFrameIds);
  }

  removeDuplicates(
    callbackMessage: (message: string) => void,
    errorMessage: (message: string) => void,
  ): Observable<void> {
    return from(this.framesRepository.removeDuplicates(callbackMessage, errorMessage));
  }

  removeNotUsedFrames(): Observable<void> {
    return this.framesRepository.removeNotUsedFrames();
  }

  addFrameFromFile(file: File): Observable<IFrame> {
    return this.framesRepository.addFrameFromFile(file, this.treeStore.selectedNode()?.id ?? null);
  }

  fetchFrames(projectId: number): Observable<void> {
    return this.framesRepository.fetchFrames(projectId);
  }

  moveTileToNode(nodeId: number, tileId: number): void {
    lastValueFrom(this.framesRepository.updateFrameTreeId(tileId, nodeId)).catch((e: unknown) => {
      console.error('Error moving frame to node', e);
    });
  }

  isCanRemove(node: ITreeItem): boolean {
    const ids = TreeHelper.collectIdsNodes(node.children);
    return this.framesStore.canRemoveTilesByTreeIds([node.id, ...ids]);
  }

  override reset(): void {
    super.reset();
    this.framesRepository.reset();
  }
}
