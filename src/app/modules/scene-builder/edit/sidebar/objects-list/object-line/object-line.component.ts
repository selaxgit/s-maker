import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { JSTDialogService } from '@jst/ui';

import { HtmlHelper } from '../../../../../../common/helpers';
import { ISceneObject, SceneObjectType } from '../../../../../../common/interfaces';
import { ScenesStore } from '../../../../../../stores/scenes.store';
import {
  IEditObjectPropertiesResult,
  SBEditObjectPropertiesComponent,
} from '../../object-properties/object-properties.component';

@Component({
    selector: 'sb-edit-sidebar-object-line',
    imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
    templateUrl: './object-line.component.html',
    styleUrl: './object-line.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SBEditSidebarObjectLineComponent {
  @Input() objectName: string = '';

  @Input() objectType!: SceneObjectType;

  @Input() objectVisible: boolean = false;

  @Input() object!: ISceneObject;

  constructor(
    public readonly scenesStore: ScenesStore,
    private readonly jstDialogService: JSTDialogService,
  ) {}

  onToggleObjectVisible(e: MouseEvent): void {
    e.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.scenesStore.updateSceneObject(this.object.sceneId, this.object.id, { visible: !this.object.visible });
  }

  onRemoveObject(e: MouseEvent): void {
    e.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.jstDialogService
      .showConfirm('Вы действительно хотите удалить этот объект?', 'Удаление объекта', 'Удалить объект')
      .subscribe((confirm: boolean) => {
        if (confirm) {
          this.scenesStore.removeSceneObject(this.object.sceneId, this.object.id);
        }
      });
  }

  onObjectProperties(e: MouseEvent): void {
    e.stopPropagation();
    HtmlHelper.blurActiveElement();
    let title = 'Редактирование объекта';
    switch (this.objectType) {
      case 'event':
        title += ' <событие>';
        break;
      case 'ground':
        title += ' <земля>';
        break;
    }
    this.jstDialogService
      .showModal<IEditObjectPropertiesResult | undefined, IEditObjectPropertiesResult>(
        title,
        SBEditObjectPropertiesComponent,
        {
          name: this.objectName,
          properties: this.object.properties,
        },
        true,
      )
      .subscribe((data: IEditObjectPropertiesResult | undefined) => {
        if (data) {
          this.scenesStore.updateSceneObject(this.object.sceneId, this.object.id, {
            name: data.name,
            properties: data.properties,
          });
        }
      });
  }
}
