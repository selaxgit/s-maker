import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SMCDragTypeEnum } from '~constants/drag.constants';
import { IViewTile } from '~core/interfaces';
import { SMCDragDirective } from '~directives/drag.directive';
import { ObjectToBgUrlPipe } from '~pipes/index';

@Component({
  selector: 'smc-tiles-list',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, ObjectToBgUrlPipe, SMCDragDirective],
  templateUrl: './tiles-list.html',
  styleUrl: './tiles-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SMCTilesList {
  readonly tiles = input<IViewTile[]>([]);

  readonly scrolling = input(true);

  readonly useCheckbox = input(false);

  readonly useCheckboxMulti = input(false);

  readonly visibleUsed = input(false);

  readonly visibleDownload = input(false);

  readonly visibleRemove = input(false);

  readonly backgroundIcon = input<string | null>('zoom_in');

  readonly isDraggable = input(false);

  readonly withBlackout = input(true);

  readonly selectedTiles = input<number[]>([]);

  readonly dragType = input<SMCDragTypeEnum>(SMCDragTypeEnum.None);

  readonly removeEvent = output<IViewTile>();

  readonly downloadEvent = output<IViewTile>();

  readonly clickEvent = output<IViewTile>();

  readonly selectedEvent = output<IViewTile | IViewTile[]>();

  handleClick(tile: IViewTile): void {
    if (this.useCheckbox()) {
      if (!this.useCheckboxMulti()) {
        this.selectedEvent.emit(tile);
      } else {
        const tiles = this.selectedTiles();
        const idx = tiles.findIndex((i: number) => i === tile.id);
        if (idx < 0) {
          tiles.push(tile.id);
        } else {
          tiles.splice(idx, 1);
        }
        const selectedTiles = tiles
          .map((id: number) => this.tiles().find((i: IViewTile) => i.id === id))
          .filter((tile: IViewTile | undefined): tile is IViewTile => tile !== undefined);
        this.selectedEvent.emit(selectedTiles);
      }
    } else {
      this.clickEvent.emit(tile);
    }
  }

  handleDownload(event: MouseEvent, tile: IViewTile): void {
    event.stopPropagation();
    this.downloadEvent.emit(tile);
  }

  handleRemove(event: MouseEvent, tile: IViewTile): void {
    event.stopPropagation();
    this.removeEvent.emit(tile);
  }
}
