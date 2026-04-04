import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ParamMap } from '@angular/router';
import { SDialogService } from '@selax/ui';
import { finalize } from 'rxjs';

import { SMCHeaderComponent } from '~components/header';
import { SMCInputTextModal } from '~components/input-text-modal';
import { APP_TITLE, SPRITES_COLLECTION_MODULE } from '~constants/base.constants';
import { ExportSpriteTypeEnum } from '~constants/sprite.constants';
import { BaseProjectPageDirective } from '~core/classes/base-project-page.directive';
import { EditSpriteFacade, SpritesFacade } from '~core/facade';
import { ISprite } from '~core/interfaces';
import { EditSpriteStore } from '~core/stores';
import { PageNotFound } from '~pages/page-not-found';
import { ExportService } from '~services/export.service';

import { SCSpriteAdjustment } from '../../components/sprite-adjustment';
import { SCSpriteAnimations } from '../../components/sprite-animations';
import { SCSpriteLayers } from '../../components/sprite-layers';
import { SCSpriteParams } from '../../components/sprite-params';

@Component({
  selector: 'sc-edit-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    PageNotFound,
    SMCHeaderComponent,
    SCSpriteLayers,
    SCSpriteParams,
    SCSpriteAdjustment,
    SCSpriteAnimations,
  ],
  templateUrl: './edit-page.html',
  styleUrl: './edit-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SCEditPage extends BaseProjectPageDirective implements OnInit {
  readonly loadingSpriteState = signal<boolean>(true);

  readonly loadingState = computed(() => this.projectStore.loadingState() || this.loadingSpriteState());

  readonly editSpriteStore = inject(EditSpriteStore);

  readonly exportSpriteType = ExportSpriteTypeEnum;

  private readonly dialogService = inject(SDialogService);

  private readonly editSpriteFacade = inject(EditSpriteFacade);

  private readonly spritesFacade = inject(SpritesFacade);

  private readonly exportService = inject(ExportService);

  constructor() {
    super();
    effect(() => {
      const projectName = this.projectStore.projectName();
      const spriteName = this.editSpriteStore.name();
      if (projectName) {
        this.titleService.setTitle(`${spriteName} | ${SPRITES_COLLECTION_MODULE.name} | ${projectName} | ${APP_TITLE}`);
        this.breadcrumbsStore.setPage(spriteName);
      }
    });
  }

  override ngOnInit(): void {
    this.breadcrumbsStore.resetPage();
    this.breadcrumbsStore.setModule(SPRITES_COLLECTION_MODULE.name, SPRITES_COLLECTION_MODULE.moduleRouter);
    super.ngOnInit();
  }

  handleSaveSprite(): void {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      return;
    }
    const needRedirect = this.editSpriteStore.sprite()!.id < 0;
    this.editSpriteFacade
      .saveSprite()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingSpriteState.set(false)),
      )
      .subscribe((sprite: ISprite) => {
        if (needRedirect) {
          const module = SPRITES_COLLECTION_MODULE;
          this.router.navigate([projectId, module.moduleRouter, sprite.id]);
        }
      });
  }

  handleChangeNameSprite(): void {
    this.dialogService
      .showModal<string>('Изменить наименование спрайта', SMCInputTextModal, {
        label: 'Наименование спрайта',
        applyTitle: 'Сохранить изменения',
        value: this.editSpriteStore.name() ?? undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value?: string) => {
        if (value) {
          this.editSpriteStore.updateSprite({ name: value });
        }
      });
  }

  handleCloneSprite(): void {
    this.dialogService
      .showModal<string>('Клонирование спрайта', SMCInputTextModal, {
        label: 'Новое наименование спрайта',
        applyTitle: 'Клонировать спрайт',
        value: `${this.editSpriteStore.name() ?? ''} (COPY)`,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value?: string) => {
        if (value) {
          this.cloneSprite(value);
        }
      });
  }

  handleRemoveSprite(): void {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      return;
    }
    this.dialogService
      .showConfirm(`Вы действительно хотите удалить этот спрайт?`, 'Удаление спрайта', 'Удалить спрайт')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isOK: boolean) => {
        if (isOK) {
          this.spritesFacade
            .removeSprite(this.editSpriteStore.sprite()!.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              const module = SPRITES_COLLECTION_MODULE;
              this.router.navigate([projectId, module.moduleRouter]);
            });
        }
      });
  }

  handleExportSprite(type: ExportSpriteTypeEnum): void {
    const spriteId = this.editSpriteStore.sprite()?.id ?? null;
    if (spriteId) {
      this.exportService.exportSprite(spriteId, type);
    } else {
      this.dialogService.showToastWarning('Спрайт не найден');
    }
  }

  protected override changeActivatedRoute(params: ParamMap): void {
    const id = params.get('id');
    this.editSpriteFacade.reset();
    if (id === 'new') {
      this.initNewSprite();
    } else if (!id || isNaN(Number(id))) {
      this.setIs404Page(true);
      this.loadingSpriteState.set(false);
    } else {
      this.loadSprite(+id);
    }
  }

  private cloneSprite(name: string): void {
    this.dialogService.showWait('Клонирование спрайта. Пожалуйста, подождите...');
    this.editSpriteFacade
      .cloneSprite(this.editSpriteStore.sprite()!, name)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.dialogService.hideWait()),
      )
      .subscribe((sprite: ISprite) => {
        const module = SPRITES_COLLECTION_MODULE;
        this.router.navigate([sprite.projectId, module.moduleRouter, sprite.id]);
      });
  }

  private initNewSprite(): void {
    this.editSpriteFacade.initNewSprite();
    this.loadingSpriteState.set(false);
  }

  private loadSprite(id: number): void {
    this.editSpriteFacade
      .fetchSprite(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingSpriteState.set(false)),
      )
      .subscribe({
        error: () => this.setIs404Page(true),
      });
  }
}
