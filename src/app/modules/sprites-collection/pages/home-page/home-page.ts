import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SDialogService } from '@selax/ui';
import { SUFileHelper } from '@selax/utils';

import { SMCHeaderComponent } from '~components/header';
import { APP_TITLE, SPRITES_COLLECTION_MODULE } from '~constants/base.constants';
import { BaseProjectPageDirective } from '~core/classes/base-project-page.directive';
import { SpritesRepository } from '~core/repositories';
import { ImportSpriteService } from '~core/services';
import { SpritesStore } from '~core/stores';
import { PageNotFound } from '~pages/page-not-found';

import { SCMultiCreateSprites } from '../../components/multi-create-sprites';
import { SCSpritesList } from '../../components/sprites-list';
import { SCSpritesTree } from '../../components/sprites-tree';

@Component({
  selector: 'sc-home-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageNotFound,
    SMCHeaderComponent,
    SCSpritesTree,
    SCSpritesList,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SCHomePagePage extends BaseProjectPageDirective implements OnInit {
  private readonly dialogService = inject(SDialogService);

  private readonly spritesStore = inject(SpritesStore);

  private readonly spritesRepository = inject(SpritesRepository);

  private readonly importSpriteService = inject(ImportSpriteService);

  constructor() {
    super();
    effect(() => {
      const projectName = this.projectStore.projectName();
      if (projectName) {
        this.titleService.setTitle(`${SPRITES_COLLECTION_MODULE.name} | ${projectName} | ${APP_TITLE}`);
      }
    });
  }

  override ngOnInit(): void {
    this.breadcrumbsStore.resetPage();
    this.breadcrumbsStore.setModule(SPRITES_COLLECTION_MODULE.name);
    super.ngOnInit();
  }

  handleImportSprite(): void {
    SUFileHelper.uploadFile<File>('.zip')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((file: File) => {
        this.dialogService.showWait('Импорт спрайта...');
        const reader = new FileReader();
        reader.onload = async (e: ProgressEvent<FileReader>) => {
          if (e.target?.result) {
            try {
              const projectId = this.projectStore.projectId()!;
              const treeId = this.spritesStore.currentTreeId();
              await this.importSpriteService.importSprite(projectId, treeId, e.target.result as ArrayBuffer);
              const errorsLog = this.importSpriteService.getErrorsLogs();
              if (errorsLog.length === 0) {
                this.dialogService.showToastSuccess('Импорт спрайта прошел успешно');
              } else {
                this.dialogService.showToastSuccess('Импорт спрайта прошел с ошибками:<br>' + errorsLog.join('<br />'));
              }
              this.spritesRepository.fetchSprites(projectId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
            } catch (e: unknown) {
              if (e instanceof Error) {
                this.dialogService.showToastError(e.message || 'Ошибка при импорте спрайта');
              } else {
                this.dialogService.showToastError('Ошибка при импорте спрайта');
              }
            } finally {
              this.dialogService.hideWait();
            }
          }
        };
        reader.onerror = () => this.dialogService.showToastError('Ошибка чтения архива');
        reader.readAsArrayBuffer(file as File);
      });
  }

  handleMultiCreateSprites(): void {
    this.dialogService
      .showModal<FileList | null>('Мультисоздание простых спрайтов', SCMultiCreateSprites, {}, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  openSprite(id: number | string): void {
    const projectId = this.projectStore.projectId();
    if (projectId) {
      const module = SPRITES_COLLECTION_MODULE;
      this.router.navigate([projectId, module.moduleRouter, id]);
    }
  }
}
