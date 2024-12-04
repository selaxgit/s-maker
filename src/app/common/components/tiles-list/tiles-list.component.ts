import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  EventEmitter,
  Input,
  input,
  Output,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { IViewTile } from '../../interfaces';

@Component({
  selector: 'smc-tiles-list',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './tiles-list.component.html',
  styleUrl: './tiles-list.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class SMCTilesListComponent {
  readonly tiles = input.required<IViewTile[]>();

  @Input() scrolling = true;

  @Input() draggable = true;

  @Input() useCheckbox = false;

  @Input() useCheckboxMulti = false;

  @Input() visibleUsed = false;

  @Input() visibleDownload = false;

  @Input() visibleRemove = false;

  @Input() backgroundIcon = 'zoom_in';

  @Output() removeEvent = new EventEmitter<IViewTile>();

  @Output() downloadEvent = new EventEmitter<IViewTile>();

  @Output() clickEvent = new EventEmitter<IViewTile>();

  @Output() dragEndEvent = new EventEmitter<number>();

  @Output() selectedEvent = new EventEmitter<IViewTile | IViewTile[]>();

  tilesList: WritableSignal<IViewTile[]> = signal([]);

  constructor() {
    effect(() => {
      this.tilesList.set(this.tiles());
    });
  }

  onRemove(e: MouseEvent, tile: IViewTile): void {
    e.stopPropagation();
    this.removeEvent.emit(tile);
  }

  onDownload(e: MouseEvent, tile: IViewTile): void {
    e.stopPropagation();
    this.downloadEvent.emit(tile);
  }

  onClick(tile: IViewTile): void {
    if (this.useCheckbox) {
      if (!this.useCheckboxMulti) {
        this.tilesList.update((tiles: IViewTile[]) => {
          tiles.forEach((i: IViewTile) => (i.selected = false));
          return [...tiles];
        });
        tile.selected = !tile.selected;
        this.selectedEvent.emit(tile);
      } else {
        tile.selected = !tile.selected;
        this.selectedEvent.emit(this.tilesList().filter((i: IViewTile) => i.selected));
      }
    } else {
      this.clickEvent.emit(tile);
    }
  }

  onDragStart(e: DragEvent, tile: IViewTile): void {
    e.dataTransfer?.setData('drag-tile', String(tile.id));
  }

  onDragEnd(e: DragEvent, idx: number, tile: IViewTile): void {
    const dropEffect = e.dataTransfer?.dropEffect;
    if (dropEffect === 'move') {
      this.tilesList.update((tiles: IViewTile[]) => {
        tiles.splice(idx, 1);
        return [...tiles];
      });
      this.dragEndEvent.emit(tile.id);
    }
  }
}
