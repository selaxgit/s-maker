import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  signal,
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
  readonly panelTitle = input('Выберите фрейм');

  readonly multiple = input(false);

  readonly selectedTiles = input<number[]>([]);

  readonly panelSelectedTiles = signal<number[]>([]);

  readonly scrollRef = viewChild.required<ElementRef<HTMLDivElement>>('scroll');

  readonly accordion = viewChild.required(MatAccordion);

  readonly accordionPanels = viewChildren(MatExpansionPanel);

  readonly framesTreeStore = inject(FramesTreeStore);

  private currentTiles: IViewTile | IViewTile[] = [];

  readonly framesStore = inject(FramesStore);

  constructor() {
    super();
    effect(() => {
      this.panelSelectedTiles.set(this.selectedTiles());
    });
  }

  handleSelectSection(event: PointerEvent, objects: IViewTile[], select: boolean): void {
    if (!this.multiple()) {
      return;
    }
    event.stopPropagation();
    if (select) {
      const selectedTiles = this.panelSelectedTiles();
      selectedTiles.push(...objects.map((i: IViewTile) => i.id));
      this.panelSelectedTiles.set([...new Set(selectedTiles)]);
      (this.currentTiles as IViewTile[]).push(...objects);
      (this.currentTiles as IViewTile[]).filter((i: IViewTile) => this.panelSelectedTiles().includes(i.id));
    } else {
      const ids = objects.map((i: IViewTile) => i.id);
      this.panelSelectedTiles.update((tilesIds: number[]) => {
        return [...tilesIds.filter((i: number) => !ids.includes(i))];
      });
      (this.currentTiles as IViewTile[]).filter((i: IViewTile) => this.panelSelectedTiles().includes(i.id));
    }
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
    return tree.some((i: IViewTile) => this.selectedTiles().includes(i.id));
  }

  handleApply(): void {
    this.closePanel(this.currentTiles);
  }

  handleClose(): void {
    this.closePanel(null);
  }
}
