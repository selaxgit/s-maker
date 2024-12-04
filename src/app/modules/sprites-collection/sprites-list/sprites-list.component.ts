import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Input,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { JSTDialogService } from '@jst/ui';
import { finalize, from } from 'rxjs';

import { SMCInputTextModalComponent, SMCTilesListComponent } from '../../../common/components';
import { SPRITES_COLLECTION_MODULE } from '../../../common/constants';
import { FileHelper, HtmlHelper } from '../../../common/helpers';
import { ISprite, IViewTile } from '../../../common/interfaces';
import { ExportSpriteService, ImportSpriteService, SpritesService } from '../../../common/services/sprites';
import { ISelectedNode, TreeStore } from '../../../stores';
import { SCSpriteMultiCreateComponent } from '../sprite-multi-create/sprite-multi-create.component';

@Component({
    selector: 'sc-sprites-list',
    imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, SMCTilesListComponent],
    templateUrl: './sprites-list.component.html',
    styleUrl: './sprites-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SCSpritesListComponent implements OnInit {
  @Input() projectId!: number;

  readonly selectedNode$ = this.treeStore.selectedNode$;

  readonly isLoading: WritableSignal<boolean> = signal(false);

  readonly tiles: WritableSignal<IViewTile[]> = signal([]);

  private currentTreeId: number | null = null;

  private destroyRef$ = inject(DestroyRef);

  constructor(
    private readonly router: Router,
    private readonly jstDialogService: JSTDialogService,
    private readonly treeStore: TreeStore,
    private readonly spritesService: SpritesService,
    private readonly exportSpriteService: ExportSpriteService,
    private readonly importSpriteService: ImportSpriteService,
  ) {}

  ngOnInit(): void {
    this.treeStore.selectedNode$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((node: ISelectedNode | null) => {
      this.currentTreeId = node?.id ?? null;
      this.fetchTiles();
    });
  }

  async onDownload(tile: IViewTile): Promise<void> {
    this.jstDialogService.showWait('Генерация SpritePack...');
    from(this.exportSpriteService.exportSpritePack(tile.id))
      .pipe(finalize(() => this.jstDialogService.hideWait()))
      .subscribe({
        next: () => this.jstDialogService.showToastSuccess('Архив готов и отправлен на скачивание'),
        error: (e: Error) => this.jstDialogService.showToastError(e.message),
      });
  }

  onImport(): void {
    if (!this.projectId) {
      return;
    }
    FileHelper.uploadFile<File>('.zip').subscribe((file: File) => {
      this.jstDialogService.showWait('Импорт спрайта...');
      const reader = new FileReader();
      reader.onload = async (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          try {
            await this.importSpriteService.importSpriteZip(
              Number(this.projectId),
              this.currentTreeId,
              e.target.result as ArrayBuffer,
            );
            this.jstDialogService.hideWait();
            this.jstDialogService.showToastSuccess('Импорт спрайта прошел успешно');
            this.fetchTiles();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            this.jstDialogService.showToastError(error.message);
          }
        }
      };
      reader.onerror = () => this.jstDialogService.showToastError('Ошибка чтения архива');
      reader.readAsArrayBuffer(file as File);
    });
  }

  onMultiAdd(): void {
    HtmlHelper.blurActiveElement();
    if (!this.projectId) {
      return;
    }
    this.jstDialogService
      .showModal<
        { isOK: boolean } | undefined,
        { projectId: number; spriteTreeId: number | null }
      >('Мультисоздание простых спрайтов', SCSpriteMultiCreateComponent, { projectId: this.projectId, spriteTreeId: this.currentTreeId }, true)
      .subscribe((value: { isOK: boolean } | undefined) => {
        if (value?.isOK) {
          this.fetchTiles();
        }
      });
  }

  onClickTile(tile: IViewTile): void {
    this.router.navigate([this.projectId, SPRITES_COLLECTION_MODULE.code, tile.id]);
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

  onRemove(tile: IViewTile): void {
    this.jstDialogService.showConfirm('Вы действительно хотите удалить этот спрайт?').subscribe((confirm: boolean) => {
      if (confirm) {
        this.isLoading.set(true);
        this.spritesService
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

  onAdd(): void {
    this.jstDialogService
      .showModal<string>('Новый спрайт', SMCInputTextModalComponent, {
        label: 'Наименование спрайта',
        applyTitle: 'Добавить спрайт',
      })
      .subscribe((value: string) => {
        if (value !== undefined) {
          this.spritesService.add(this.projectId, this.currentTreeId, value).subscribe((sprite: ISprite) => {
            this.router.navigate([this.projectId, SPRITES_COLLECTION_MODULE.code, sprite.id]);
          });
        }
      });
  }

  private fetchTiles(): void {
    this.spritesService
      .fetchTiles(this.projectId, this.currentTreeId)
      .pipe(
        takeUntilDestroyed(this.destroyRef$),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((tiles: IViewTile[]) => {
        this.tiles.set(tiles);
      });
  }
}
