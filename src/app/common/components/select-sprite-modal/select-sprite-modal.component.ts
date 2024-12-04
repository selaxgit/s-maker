import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';

import { ISelectedNode, TreeStore } from '../../../stores';
import { IViewTile } from '../../interfaces';
import { SpritesService, SpritesTreeDBService } from '../../services/sprites';
import { TreeService } from '../../services/tree';
import { SMCTilesListComponent } from '../tiles-list/tiles-list.component';
import { SMCTreeComponent } from '../tree';

@Component({
    selector: 'smc-select-sprite-modal',
    imports: [
        CommonModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatIconModule,
        SMCTreeComponent,
        SMCTilesListComponent,
    ],
    providers: [TreeService, TreeStore],
    templateUrl: './select-sprite-modal.component.html',
    styleUrl: './select-sprite-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SMCSelectSpriteModalComponent {
  readonly dialogRef!: MatDialogRef<SMCSelectSpriteModalComponent>;

  projectId!: number;

  multiple = false;

  readonly isLoading: WritableSignal<boolean> = signal(false);

  readonly tiles: WritableSignal<IViewTile[]> = signal([]);

  readonly selectedTiles: WritableSignal<IViewTile[]> = signal([]);

  readonly allCount: Signal<number> = computed(() => this.tiles().length);

  readonly disableApplyState: Signal<boolean> = computed(() => this.selectedTiles().length === 0);

  private destroyRef$ = inject(DestroyRef);

  constructor(
    private readonly treeService: TreeService,
    private readonly treeStore: TreeStore,
    private readonly spritesTreeDBService: SpritesTreeDBService,
    private readonly spritesService: SpritesService,
  ) {
    this.treeService.setBaseService(this.spritesTreeDBService);
  }

  setData(data: { projectId: number; multiple: boolean }): void {
    this.projectId = data.projectId;
    this.multiple = data.multiple ?? false;
    this.treeStore.selectedNode$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((node: ISelectedNode | null) => {
      this.fetchTiles(node?.id ?? null, true);
    });
  }

  onApply(): void {
    this.dialogRef?.close(this.selectedTiles());
  }

  onClose(): void {
    this.dialogRef?.close();
  }

  onSelectedTiles(tiles: IViewTile | IViewTile[]): void {
    if (Array.isArray(tiles)) {
      this.selectedTiles.set(tiles);
    } else {
      this.selectedTiles.set([tiles]);
    }
  }

  private fetchTiles(treeId: number | null, clearSelected: boolean = false): void {
    this.spritesService
      .fetchTiles(this.projectId, treeId)
      .pipe(
        takeUntilDestroyed(this.destroyRef$),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((tiles: IViewTile[]) => {
        if (clearSelected) {
          tiles.forEach((i: IViewTile) => (i.selected = false));
        }
        this.tiles.set(tiles);
      });
  }
}
