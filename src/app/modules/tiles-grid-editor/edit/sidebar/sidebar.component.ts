import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { combineLatest } from 'rxjs';

import { SMCTilesListComponent } from '../../../../common/components';
import { IViewTile } from '../../../../common/interfaces';
import { TilesGridStore } from '../../../../stores';

@Component({
    selector: 'tge-edit-sidebar',
    imports: [CommonModule, MatButtonModule, MatIconModule, SMCTilesListComponent],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TGEEditSidebarComponent implements AfterViewInit {
  @ViewChild('scroll') scrollRef!: ElementRef<HTMLDivElement>;

  private readonly destroyRef$ = inject(DestroyRef);

  constructor(public readonly tilesGridStore: TilesGridStore) {}

  ngAfterViewInit(): void {
    combineLatest([this.tilesGridStore.editorDrawTile$, this.tilesGridStore.editorVisibleSidebar$])
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe(([tile, visible]: [IViewTile | null, boolean]) => {
        if (visible && tile) {
          setTimeout(() => {
            if (this.scrollRef?.nativeElement) {
              const el = this.scrollRef.nativeElement.querySelector(`#tile-item-${tile.id}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          });
        }
      });
  }
}
