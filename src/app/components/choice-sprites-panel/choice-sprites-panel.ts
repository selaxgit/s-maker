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
import { SpritesStore, SpritesTreeStore } from '~core/stores';

@Component({
  imports: [MatButtonModule, MatExpansionModule, SSlidePanelContainerComponent, SMCTilesList],
  templateUrl: './choice-sprites-panel.html',
  styleUrl: './choice-sprites-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SMCChoiceSpritesPanel extends SSlidePanelExtendClass {
  panelTitle = input('Выберите спрайт');

  multiple = input(false);

  selectedSprites = input<number[]>([]);

  scrollRef = viewChild.required<ElementRef<HTMLDivElement>>('scroll');

  readonly accordion = viewChild.required(MatAccordion);

  readonly accordionPanels = viewChildren(MatExpansionPanel);

  readonly spritesTreeStore = inject(SpritesTreeStore);

  private currentTiles: IViewTile | IViewTile[] = [];

  readonly spritesStore = inject(SpritesStore);

  constructor() {
    super();

    effect(() => {
      const selectedSprites = this.selectedSprites();
      this.spritesStore.setSelectedByIds(selectedSprites);
    });
  }

  getTreeObjects(treeId: number | null = null): IViewTile[] {
    return this.spritesStore.getFilteredTiles(treeId);
  }

  handleSelectSprite(tile: IViewTile | IViewTile[]): void {
    if (!this.multiple()) {
      this.closePanel(tile);
    } else {
      this.currentTiles = tile;
    }
  }

  hasSelectedSprite(tree: IViewTile[]): boolean {
    return tree.some((i: IViewTile) => i.selected);
  }

  handleApply(): void {
    this.closePanel(this.currentTiles);
  }

  handleClose(): void {
    this.closePanel(null);
  }
}
