import { CdkMenuModule } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, inject, input, TemplateRef, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ITilesGridItem } from '~core/interfaces';
import { EditGridStore } from '~core/stores/edit-grid.store';

enum ActionEnum {
  SwitchFlipVertical = 'switch-flip-vertical',
  SwitchFlipHorizontal = 'switch-flip-horizontal',
  SwitchStretch = 'switch-stretch',
  ShowPropeties = 'show-propeties',
  TopZIndex = 'top-z-index',
  Remove = 'remove',
}

@Component({
  selector: 'tge-context-menu',
  imports: [CdkMenuModule, MatIconModule],
  templateUrl: './context-menu.html',
  styleUrl: './context-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TGEContextMenu {
  readonly menuGridItems = input.required<ITilesGridItem[]>();

  readonly menu = viewChild.required<TemplateRef<unknown>>('menu');

  readonly actionEnum = ActionEnum;

  private readonly editGridStore = inject(EditGridStore);

  handleRemoveAll(): void {
    const tile = this.menuGridItems().pop();
    if (tile) {
      this.editGridStore.removeGridItemByCoords({ x: tile.x, y: tile.y });
    }
  }

  handleAction(action: ActionEnum, tile: ITilesGridItem): void {
    switch (action) {
      case ActionEnum.SwitchFlipVertical:
        this.editGridStore.updateGridItemByCoords({ x: tile.x, y: tile.y }, tile.frameId, {
          flipVertical: !tile.flipVertical,
        });
        break;
      case ActionEnum.SwitchFlipHorizontal:
        this.editGridStore.updateGridItemByCoords({ x: tile.x, y: tile.y }, tile.frameId, {
          flipHorizontal: !tile.flipHorizontal,
        });
        break;
      case ActionEnum.SwitchStretch:
        this.editGridStore.updateGridItemByCoords({ x: tile.x, y: tile.y }, tile.frameId, { stretch: !tile.stretch });
        break;
      case ActionEnum.ShowPropeties:
        this.editGridStore.showGridItemPropetiesEvent(tile);
        break;
      case ActionEnum.TopZIndex:
        this.editGridStore.topZIndexGridItemByCoords({ x: tile.x, y: tile.y }, tile.frameId);
        break;
      case ActionEnum.Remove:
        this.editGridStore.removeGridItemByCoords({ x: tile.x, y: tile.y }, tile.frameId);
        break;
    }
  }
}
