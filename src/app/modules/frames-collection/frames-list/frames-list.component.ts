import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Input,
  OnInit,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { JSTDialogService } from '@jst/ui';
import { finalize } from 'rxjs';

import { SMCTilesListComponent } from '../../../common/components';
import { FileHelper } from '../../../common/helpers';
import { IViewTile } from '../../../common/interfaces';
import { SessionStorageService } from '../../../common/services/common';
import { FramesService } from '../../../common/services/frames';
import { ISelectedNode, TreeStore } from '../../../stores';
import { CutFramesFromFileModalComponent } from '../cut-frames-from-file-modal/cut-frames-from-file-modal.component';
import { CutFromFileModalComponent } from '../cut-from-file-modal/cut-from-file-modal.component';
import { FCViewFrameModalComponent, IViewFrameModalResult } from '../view-frame-modal/view-frame-modal.component';

type SortByType = 'none' | 'used' | 'not-used';
const STORE_KEY_SORT_BY = 's-marker:fc-list:sortby';

@Component({
    selector: 'fc-frames-list',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatMenuModule,
        MatDividerModule,
        SMCTilesListComponent,
    ],
    templateUrl: './frames-list.component.html',
    styleUrl: './frames-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FCFramesListComponent implements OnInit {
  @Input() projectId!: number;

  readonly selectedNode$ = this.treeStore.selectedNode$;

  readonly isLoading: WritableSignal<boolean> = signal(false);

  readonly loadingMessage: WritableSignal<string | null> = signal(null);

  readonly tiles: WritableSignal<IViewTile[]> = signal([]);

  readonly countNotUsed: Signal<number> = computed(() => this.tiles().filter((i: IViewTile) => !i.used).length);

  readonly countUsed: Signal<number> = computed(() => this.tiles().filter((i: IViewTile) => i.used).length);

  readonly sortBy: WritableSignal<SortByType> = signal('none');

  private currentTreeId: number | null = null;

  private destroyRef$ = inject(DestroyRef);

  constructor(
    private readonly jstDialogService: JSTDialogService,
    private readonly sessionStorageService: SessionStorageService,
    private readonly treeStore: TreeStore,
    private readonly framesService: FramesService,
  ) {
    const sortBy = sessionStorageService.get<SortByType>(STORE_KEY_SORT_BY);
    if (sortBy) {
      this.sortBy.set(sortBy);
    }
  }

  ngOnInit(): void {
    this.treeStore.selectedNode$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((node: ISelectedNode | null) => {
      this.currentTreeId = node?.id ?? null;
      this.fetchTiles();
    });
  }

  onDownload(tile: IViewTile): void {
    if (!tile.file) {
      return;
    }
    const objectURL = URL.createObjectURL(tile.file);
    const link = document.createElement('a');
    link.setAttribute('href', objectURL);
    link.setAttribute('download', `${tile.name}.png`);
    link.click();
  }

  onClickTile(tile: IViewTile): void {
    this.jstDialogService
      .showModal<IViewFrameModalResult>('Просмотр тайла', FCViewFrameModalComponent, { tile })
      .subscribe((result: IViewFrameModalResult) => {
        if (result) {
          this.framesService.update(tile.id, result).subscribe(() => {
            this.framesService.clearCacheById(tile.id);
            this.fetchTiles();
          });
        }
      });
  }

  onDragEndTile(id: number): void {
    this.tiles.update((tiles: IViewTile[]) => {
      const idx = tiles.findIndex((i: IViewTile) => i.id === id);
      if (idx >= 0) {
        tiles.splice(idx, 1);
      }
      return tiles;
    });
  }

  onRemoveDuplicatesFrames(): void {
    this.jstDialogService.showConfirm('Вы действительно хотите удалить дубли фреймы?').subscribe((confirm: boolean) => {
      if (confirm) {
        this.removeDuplicatesFrames();
      }
    });
  }

  onRemoveNotUsedFrames(): void {
    this.jstDialogService
      .showConfirm('Вы действительно хотите удалить все неиспользуемые фреймы?')
      .subscribe((confirm: boolean) => {
        if (confirm) {
          const ids = this.tiles()
            .filter((i: IViewTile) => !i.used)
            .map((i: IViewTile) => i.id);
          if (ids.length > 0) {
            this.isLoading.set(true);
            this.framesService.batchRemove(ids).subscribe(() => this.fetchTiles());
          }
        }
      });
  }

  setSortBy(sortBy: SortByType): void {
    this.sortBy.set(sortBy);
    this.sessionStorageService.set(STORE_KEY_SORT_BY, sortBy);
    this.sortFilesList();
  }

  onCutFromFile(): void {
    this.jstDialogService
      .showModal<boolean>(
        'Вырезать фрейм из файла',
        CutFromFileModalComponent,
        { projectId: this.projectId, treeId: this.currentTreeId },
        true,
      )
      .subscribe((result: boolean) => {
        if (result) {
          this.fetchTiles();
        }
      });
  }

  onCutFramesFromFile(): void {
    this.jstDialogService
      .showModal<boolean>(
        'Нарезать фреймы из файла',
        CutFramesFromFileModalComponent,
        { projectId: this.projectId, treeId: this.currentTreeId },
        true,
      )
      .subscribe((result: boolean) => {
        if (result) {
          this.fetchTiles();
        }
      });
  }

  onAddFromFiles(): void {
    FileHelper.uploadFile<FileList>('image/*', true).subscribe((files: FileList) => {
      this.isLoading.set(true);
      this.framesService.addFromFiles(this.projectId, this.currentTreeId, files).subscribe(() => this.fetchTiles());
    });
  }

  onRemove(tile: IViewTile): void {
    this.jstDialogService.showConfirm('Вы действительно хотите удалить этот фрейм?').subscribe((confirm: boolean) => {
      if (confirm) {
        this.isLoading.set(true);
        this.framesService
          .remove(tile.id)
          .pipe(finalize(() => this.isLoading.set(false)))
          .subscribe(() => {
            this.tiles.update((tiles: IViewTile[]) => {
              const idx = tiles.findIndex((i: IViewTile) => i.id === tile.id);
              if (idx >= 0) {
                tiles.splice(idx, 1);
              }
              return tiles;
            });
          });
      }
    });
  }

  private fetchTiles(): void {
    this.isLoading.set(true);
    this.framesService
      .fetchTiles(this.projectId, this.currentTreeId)
      .pipe(
        takeUntilDestroyed(this.destroyRef$),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((tiles: IViewTile[]) => {
        this.tiles.set(tiles);
      });
  }

  private sortFilesList(): void {
    switch (this.sortBy()) {
      case 'used':
        this.tiles.update((tiles: IViewTile[]) =>
          tiles.sort((a: IViewTile, b: IViewTile) => Number(b.used) - Number(a.used)),
        );
        break;
      case 'not-used':
        this.tiles.update((tiles: IViewTile[]) =>
          tiles.sort((a: IViewTile, b: IViewTile) => Number(a.used) - Number(b.used)),
        );
        break;
    }
  }

  private removeDuplicatesFrames(): void {
    this.isLoading.set(true);
    this.loadingMessage.set('Удаление дублей фреймов...');
    this.framesService
      .removeDuplicatesTiles(this.tiles(), (message: string) => this.loadingMessage.set(message))
      .subscribe(() => {
        this.loadingMessage.set(null);
        this.fetchTiles();
      });
  }
}
