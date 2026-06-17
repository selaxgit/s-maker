import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SDialogService } from '@selax/ui';

import { ISceneLayer, SceneObjectType } from '~core/interfaces';
import { EditSceneStore } from '~core/stores';

import { SBObjectPropertiesPanelService, TypeObjectPropertiesPanelEnum } from '../../../../services';
import { IObjectPropertiesPanelResult } from '../../../object-properties-panel';

@Component({
  selector: 'sb-object-item',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './object-item.html',
  styleUrl: './object-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SBObjectItem {
  readonly object = input.required<SceneObjectType>();

  readonly layer = input.required<ISceneLayer>();

  readonly editSceneStore = inject(EditSceneStore);

  private readonly destroyRef = inject(DestroyRef);

  private readonly dialogService = inject(SDialogService);

  private readonly objectPropertiesPanelService = inject(SBObjectPropertiesPanelService);

  handleSelectObject(): void {
    this.editSceneStore.setCurrent(this.layer(), this.object());
  }

  handleEditObject(): void {
    this.objectPropertiesPanelService
      .showObjectPropertiesPanel(
        TypeObjectPropertiesPanelEnum.EDIT_OBJECT,
        this.layer().type,
        this.object().name,
        this.object().properties,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: IObjectPropertiesPanelResult | null) => {
        if (result) {
          this.editSceneStore.updateLayerObject(this.layer().guid, this.object().guid, result);
        }
      });
  }

  handleRemoveObject(): void {
    this.dialogService
      .showConfirm(
        `Вы действительно хотите удалить объект "${this.object().name}"?`,
        'Удаление объекта',
        'Удалить объект',
      )
      .subscribe((isOK: boolean) => {
        if (isOK) {
          this.editSceneStore.removeObject(this.layer().guid, this.object().guid);
        }
      });
  }

  handleToggleVisibleObject(): void {
    this.editSceneStore.updateLayerObject(this.layer().guid, this.object().guid, { visible: !this.object().visible });
  }
}
