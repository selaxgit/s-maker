import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { SDialogService } from '@selax/ui';

import { SMCAbout } from '~components/about';
import {
  FRAMES_COLLECTION_MODULE,
  LANDSCAPE_GENERATOR_MODULE,
  SCENE_BUILDER_MODULE,
  SPRITES_COLLECTION_MODULE,
  TILES_GRID_EDITOR_MODULE,
} from '~constants/base.constants';
import { IScene, ITilesGrid } from '~core/interfaces';
import { BreadcrumbsStore, ScenesListStore } from '~core/stores';
import { GridListStore } from '~core/stores/grid-list.store';

@Component({
  selector: 'smc-header',
  imports: [MatButtonModule, RouterLink, MatIconModule, MatTooltipModule, MatMenuModule, MatDividerModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SMCHeaderComponent {
  readonly visibleModulesMenu = input<boolean>(false);

  readonly visibleBreadcrumbs = input<boolean>(false);

  readonly framesCollectionModule = FRAMES_COLLECTION_MODULE;

  readonly spritesCollectionModule = SPRITES_COLLECTION_MODULE;

  readonly landscapeGeneratorModule = LANDSCAPE_GENERATOR_MODULE;

  readonly tilesGridEditorModule = TILES_GRID_EDITOR_MODULE;

  readonly sceneBuilderModule = SCENE_BUILDER_MODULE;

  private readonly gridListStore = inject(GridListStore);

  private readonly scenesListStore = inject(ScenesListStore);

  readonly gridList = computed(() => {
    const gridList = this.gridListStore.gridList();
    return (
      gridList?.map((grid: ITilesGrid) => ({
        id: grid.id,
        name: grid.name,
      })) ?? []
    );
  });

  readonly scenesList = computed(() => {
    const scenesList = this.scenesListStore.scenesList();
    return (
      scenesList?.map((scene: IScene) => ({
        id: scene.id,
        name: scene.name,
      })) ?? []
    );
  });

  private readonly destroyRef = inject(DestroyRef);

  readonly breadcrumbsStore = inject(BreadcrumbsStore);

  private readonly dialogService = inject(SDialogService);

  handleAbout(): void {
    this.dialogService.showModal('О программе', SMCAbout).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
