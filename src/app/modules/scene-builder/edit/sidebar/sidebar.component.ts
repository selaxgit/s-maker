import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { JSTDialogService } from '@jst/ui';

import { SMCInputTextModalComponent } from '../../../../common/components';
import { SceneObjectType } from '../../../../common/interfaces';
import { TilesGridStore } from '../../../../stores';
import { ScenesStore } from '../../../../stores/scenes.store';
import { SBEditSidebarCurrentObjectComponent } from './current-object/current-object.component';
import { SBEditSidebarObjectsListComponent } from './objects-list/objects-list.component';

@Component({
    selector: 'sb-edit-sidebar',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        SBEditSidebarObjectsListComponent,
        SBEditSidebarCurrentObjectComponent,
    ],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SBEditSidebarComponent {
  constructor(
    public readonly scenesStore: ScenesStore,
    public readonly tilesGridStore: TilesGridStore,
    private readonly jstDialogService: JSTDialogService,
  ) {}

  onAddObject(projectId: number, sceneId: number, type: SceneObjectType, name?: string, referenceId?: number): void {
    if (type === 'layer-grid' && name && referenceId) {
      this.scenesStore.addSceneObject(sceneId, { projectId, sceneId, type, name, referenceId });
    } else {
      let label = 'Наименование слоя';
      switch (type) {
        case 'layer-events':
          label = 'Наименование слоя для событий';
          break;
        case 'layer-ground':
          label = 'Наименование слоя для земли';
          break;
        case 'layer-sprites':
          label = 'Наименование слоя для спрайтов';
          break;
      }
      this.jstDialogService
        .showModal<string | undefined>(
          'Добавление слоя для объектов',
          SMCInputTextModalComponent,
          {
            label,
            applyTitle: 'Добавить слой',
          },
          true,
        )
        .subscribe((value: string | undefined) => {
          if (value !== undefined) {
            this.scenesStore.addSceneObject(sceneId, { projectId, sceneId, type, name: value });
          }
        });
    }
  }
}
