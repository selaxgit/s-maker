import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { JSTDialogService } from '@jst/ui';
import { provideComponentStore } from '@ngrx/component-store';
import { combineLatest, finalize, of } from 'rxjs';

import { SMCHeaderComponent, SMCInputTextModalComponent, SMCPageNotFoundComponent } from '../../../common/components';
import { APP_TITLE, SPRITES_COLLECTION_MODULE } from '../../../common/constants';
import { HtmlHelper } from '../../../common/helpers';
import { IProject, ISprite } from '../../../common/interfaces';
import { ExportSpriteService, SpritesService } from '../../../common/services/sprites';
import { ProjectStore, SpriteStore } from '../../../stores';
import { SCSpriteAdjustmentComponent } from './sprite-adjustment/sprite-adjustment.component';
import { SCSpriteAnimationsComponent } from './sprite-animations/sprite-animations.component';
import { SCSpriteLayersComponent } from './sprite-layers/sprite-layers.component';
import { SCSpriteParamsComponent } from './sprite-params/sprite-params.component';

@Component({
    selector: 'sc-sprite-edit',
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        SMCHeaderComponent,
        SMCPageNotFoundComponent,
        SCSpriteLayersComponent,
        SCSpriteParamsComponent,
        SCSpriteAdjustmentComponent,
        SCSpriteAnimationsComponent,
    ],
    providers: [provideComponentStore(SpriteStore)],
    templateUrl: './sprite-edit.component.html',
    styleUrl: './sprite-edit.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SCSpriteEditComponent {
  readonly currentModule = SPRITES_COLLECTION_MODULE;

  readonly isSpriteInitializing$ = this.spriteStore.isInitializing$;

  readonly sprite$ = this.spriteStore.sprite$;

  constructor(
    public readonly projectStore: ProjectStore,
    private readonly titleService: Title,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly jstDialogService: JSTDialogService,
    private readonly spriteStore: SpriteStore,
    private readonly exportSpriteService: ExportSpriteService,
    private readonly spritesService: SpritesService,
  ) {
    this.activatedRoute.paramMap.pipe(takeUntilDestroyed()).subscribe((params: ParamMap) => {
      this.projectStore.initialize(params.get('pid'));
      this.spriteStore.initialize(params.get('id'));
    });
    combineLatest([this.projectStore.project$, this.sprite$])
      .pipe(takeUntilDestroyed())
      .subscribe(([project, sprite]: [IProject | null, ISprite | null]) => {
        if (project && sprite) {
          this.titleService.setTitle(`${sprite.name} | ${this.currentModule.name} | ${project.name} | ${APP_TITLE}`);
        }
      });
  }

  onRemoveSprite(sprite: ISprite): void {
    this.jstDialogService.showConfirm('Вы действительно хотите удалить этот спрайт?').subscribe((confirm: boolean) => {
      if (confirm) {
        this.spritesService.remove(sprite.id).subscribe(() => {
          this.router.navigate([sprite.projectId, SPRITES_COLLECTION_MODULE.code]);
        });
      }
    });
  }

  onCloneSprite(sprite: ISprite): void {
    HtmlHelper.blurActiveElement();
    this.jstDialogService
      .showModal<string>('Создание копии спрайта', SMCInputTextModalComponent, {
        label: 'Наименование спрайта',
        applyTitle: 'Создать копию спрайта',
        value: sprite.name,
      })
      .subscribe((value: string) => {
        if (value !== undefined) {
          this.spritesService.cloneSprite(sprite.id, value).subscribe((id: number) => {
            this.router.navigate([sprite.projectId, SPRITES_COLLECTION_MODULE.code, id]);
            this.jstDialogService.showToastSuccess('Копия спрайта создана успешно');
          });
        }
      });
  }

  onExportSprite(sprite: ISprite, type: 'default' | 'for-game'): void {
    this.jstDialogService.showWait('Генерация SpritePack...');
    switch (type) {
      case 'default':
        of(this.exportSpriteService.exportSpritePack(sprite.id))
          .pipe(finalize(() => this.jstDialogService.hideWait()))
          .subscribe({
            next: () => this.jstDialogService.showToastSuccess('Архив готов и отправлен на скачивание'),
            error: (e: Error) => this.jstDialogService.showToastError(e.message),
          });
        break;
      case 'for-game':
        of(this.exportSpriteService.exportSpritePackForGame(sprite.id))
          .pipe(finalize(() => this.jstDialogService.hideWait()))
          .subscribe({
            next: () => this.jstDialogService.showToastSuccess('Архив готов и отправлен на скачивание'),
            error: (e: Error) => this.jstDialogService.showToastError(e.message),
          });
        break;
      default:
        this.jstDialogService.hideWait();
    }
  }

  onChangeNameSprite(sprite: ISprite): void {
    HtmlHelper.blurActiveElement();
    this.jstDialogService
      .showModal<string>('Изменение спрайта', SMCInputTextModalComponent, {
        label: 'Наименование спрайта',
        applyTitle: 'Изменить спрайт',
        value: sprite.name,
      })
      .subscribe((value: string) => {
        if (value !== undefined) {
          this.spriteStore.updateSprite({ name: value });
        }
      });
  }
}
