import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';

import { SMCPropertiesContainerComponent } from '../../../../common/components';
import { IProperties, ReplaceTilePropertiesType } from '../../../../common/interfaces';

export interface IPropertyForAllModalResult {
  replaceType: ReplaceTilePropertiesType;
  properties: IProperties;
}

@Component({
    selector: 'tge-property-for-all-modal',
    imports: [CommonModule, MatButtonModule, SMCPropertiesContainerComponent],
    templateUrl: './property-for-all-modal.component.html',
    styleUrl: './property-for-all-modal.component.scss'
})
export class TGEPropertyForAllModalComponent {
  dialogRef!: MatDialogRef<TGEPropertyForAllModalComponent>;

  replaceType: ReplaceTilePropertiesType = 'add';

  private properties: IProperties = {};

  onApply(): void {
    this.dialogRef?.close({ replaceType: this.replaceType, properties: this.properties });
  }

  onChangeProperties(props: IProperties): void {
    this.properties = props;
  }

  onClose(): void {
    this.dialogRef?.close();
  }
}
