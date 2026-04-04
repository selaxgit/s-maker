import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
  viewChildren,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatAccordion, MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { SSlidePanelContainerComponent, SSlidePanelExtendClass } from '@selax/ui';

import { SMCTilesList } from '~components/tiles-list';
import { IViewTile } from '~core/interfaces';
import { FramesStore, FramesTreeStore } from '~core/stores';

@Component({
  imports: [MatButtonModule, MatExpansionModule, SSlidePanelContainerComponent, SMCTilesList],
  templateUrl: './choice-frames-panel.html',
  styleUrl: './choice-frames-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SMCChoiceFramesPanel extends SSlidePanelExtendClass {
  panelTitle = input('Выберите фрейм');

  multiple = input(false);

  selectedTiles = input<number[]>([]);

  scrollRef = viewChild.required<ElementRef<HTMLDivElement>>('scroll');

  readonly accordion = viewChild.required(MatAccordion);

  readonly accordionPanels = viewChildren(MatExpansionPanel);

  readonly framesTreeStore = inject(FramesTreeStore);

  private currentTiles: IViewTile | IViewTile[] = [];

  readonly framesStore = inject(FramesStore);

  constructor() {
    super();

    effect(() => {
      const selectedTiles = this.selectedTiles();
      this.framesStore.setSelectedByIds(selectedTiles);
    });
  }

  getTreeObjects(treeId: number | null = null): IViewTile[] {
    return this.framesStore.getFilteredTiles(treeId);
  }

  handleSelectTile(tile: IViewTile | IViewTile[]): void {
    if (!this.multiple()) {
      this.closePanel(tile);
    } else {
      this.currentTiles = tile;
    }
  }

  hasSelectedTile(tree: IViewTile[]): boolean {
    return tree.some((i: IViewTile) => i.selected);
  }

  handleApply(): void {
    this.closePanel(this.currentTiles);
  }

  handleClose(): void {
    this.closePanel(null);
  }
}
