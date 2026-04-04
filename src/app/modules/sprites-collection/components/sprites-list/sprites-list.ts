import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { SDialogService } from '@selax/ui';

import { SMCTilesList } from '~components/tiles-list';
import { SPRITES_COLLECTION_MODULE } from '~constants/base.constants';
import { SMCDragTypeEnum } from '~constants/drag.constants';
import { ExportSpriteTypeEnum } from '~constants/sprite.constants';
import { SpritesFacade } from '~core/facade';
import { IViewTile } from '~core/interfaces';
import { ProjectStore, SpritesStore } from '~core/stores';
import { ExportService } from '~services/export.service';

@Component({
  selector: 'sc-sprites-list',
  imports: [SMCTilesList],
  templateUrl: './sprites-list.html',
  styleUrls: ['./sprites-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SCSpritesList {
  readonly dragType = SMCDragTypeEnum;

  readonly spritesStore = inject(SpritesStore);

  private readonly destroyRef = inject(DestroyRef);

  private readonly dialogService = inject(SDialogService);

  private readonly router = inject(Router);

  private readonly projectStore = inject(ProjectStore);

  private readonly spritesFacade = inject(SpritesFacade);

  private readonly exportService = inject(ExportService);

  handleRemoveTile(tile: IViewTile): void {
    this.dialogService
      .showConfirm(`Вы действительно хотите удалить этот спрайт?`, 'Удаление спрайта', 'Удалить спрайт')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isOK: boolean) => {
        if (isOK) {
          this.spritesFacade.removeSprite(tile.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
        }
      });
  }

  handleDownloadTile(tile: IViewTile): void {
    this.exportService.exportSprite(tile.id, ExportSpriteTypeEnum.Default);
  }

  handleShowTile(tile: IViewTile): void {
    const projectId = this.projectStore.projectId();
    if (projectId) {
      const module = SPRITES_COLLECTION_MODULE;
      this.router.navigate([projectId, module.moduleRouter, tile.id]);
    }
  }
}
