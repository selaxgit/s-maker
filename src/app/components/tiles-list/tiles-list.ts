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

  readonly dragType = input<SMCDragTypeEnum>(SMCDragTypeEnum.None);

  readonly removeEvent = output<IViewTile>();

  readonly downloadEvent = output<IViewTile>();

  readonly clickEvent = output<IViewTile>();

  readonly selectedEvent = output<IViewTile | IViewTile[]>();

  handleClick(tile: IViewTile): void {
    if (this.useCheckbox()) {
      if (!this.useCheckboxMulti()) {
        this.tiles().forEach((i: IViewTile) => (i.selected = false));
        tile.selected = !tile.selected;
        this.selectedEvent.emit(tile);
      } else {
        tile.selected = !tile.selected;
        this.selectedEvent.emit(this.tiles().filter((i: IViewTile) => i.selected));
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
