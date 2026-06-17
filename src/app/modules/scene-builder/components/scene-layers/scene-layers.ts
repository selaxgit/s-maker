import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { SceneLayerTypeEnum } from '~core/constants';
import { ISceneLayer, ITilesGrid } from '~core/interfaces';
import { EditSceneStore } from '~core/stores';
import { GridListStore } from '~core/stores/grid-list.store';

import { SBObjectPropertiesPanelService, TypeObjectPropertiesPanelEnum } from '../../services';
import { SBObjectParams } from '../object-params';
import { IObjectPropertiesPanelResult } from '../object-properties-panel';
import { SBLayerItem } from './components/layer-item';

@Component({
  selector: 'sb-scene-layers',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, DragDropModule, SBLayerItem, SBObjectParams],
  templateUrl: './scene-layers.html',
  styleUrl: './scene-layers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SBSceneLayers {
  readonly layerTypeEnum = SceneLayerTypeEnum;

  readonly editSceneStore = inject(EditSceneStore);

  private readonly destroyRef = inject(DestroyRef);

  private readonly gridListStore = inject(GridListStore);

  private readonly objectPropertiesPanelService = inject(SBObjectPropertiesPanelService);

  readonly gridList = computed(() => {
    const gridList = this.gridListStore.gridList();
    return (
      gridList?.map((grid: ITilesGrid) => ({
        id: grid.id,
        name: grid.name,
      })) ?? []
    );
  });

  handleDropLayer(event: CdkDragDrop<ISceneLayer[]>): void {
    if (event.isPointerOverContainer && event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.editSceneStore.updateScene({ layers: event.container.data });
    }
  }

  handleAddGridLayer(id: number, name: string): void {
    this.editSceneStore.addLayer(SceneLayerTypeEnum.Grids, name, {}, id);
  }

  handleAddLayer(type: SceneLayerTypeEnum): void {
    this.objectPropertiesPanelService
      .showObjectPropertiesPanel(TypeObjectPropertiesPanelEnum.ADD_LAYER, type)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: IObjectPropertiesPanelResult | null) => {
        if (result) {
          this.editSceneStore.addLayer(type, result.name, result.properties);
        }
      });
  }
}
