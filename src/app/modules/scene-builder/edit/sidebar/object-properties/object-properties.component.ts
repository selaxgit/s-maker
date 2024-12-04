import { CommonModule } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { JSTFormControl, JSTInputModule } from '@jst/ui';

import { SMCPropertiesContainerComponent } from '../../../../../common/components';
import { IProperties } from '../../../../../common/interfaces';

export interface IEditObjectPropertiesResult {
  name: string;
  properties: IProperties | null;
}

@Component({
    selector: 'sb-edit-object-properties',
    imports: [CommonModule, MatButtonModule, SMCPropertiesContainerComponent, JSTInputModule],
    templateUrl: './object-properties.component.html',
    styleUrl: './object-properties.component.scss'
})
export class SBEditObjectPropertiesComponent {
  dialogRef!: MatDialogRef<SBEditObjectPropertiesComponent>;

  controlObjectName = new JSTFormControl(null, Validators.required);

  applyTitle = 'Добавить объект';

  propertiesList: WritableSignal<IProperties> = signal({});

  private properties: IProperties = {};

  onApply(): void {
    if (this.controlObjectName.valid) {
      this.dialogRef?.close({
        name: this.controlObjectName.value,
        properties: this.properties,
      });
    }
  }

  onChangeProperties(props: IProperties): void {
    this.properties = props;
  }

  onClose(): void {
    this.dialogRef?.close();
  }

  setData(data: IEditObjectPropertiesResult): void {
    if (data?.properties) {
      this.propertiesList.set(data.properties);
      this.properties = data.properties;
    }
    if (data?.name) {
      this.controlObjectName.setValue(data.name);
      this.applyTitle = 'Сохранить объект';
    }
  }
}
