/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { IJSTSelectItem, JSTFormControl, JSTInputModule, JSTSelectModule, JSTTouchspinModule } from '@jst/ui';

import { IScene } from '../../../common/interfaces';

@Component({
    selector: 'sb-params',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatTabsModule,
        JSTInputModule,
        JSTTouchspinModule,
        JSTSelectModule,
    ],
    templateUrl: './params.component.html',
    styleUrl: './params.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SBParamsComponent {
  dialogRef!: MatDialogRef<SBParamsComponent>;

  formGroup = new FormGroup({
    name: new JSTFormControl(null, Validators.required),
    width: new JSTFormControl(null),
    height: new JSTFormControl(null),
    offsetX: new JSTFormControl(null),
    offsetY: new JSTFormControl(null),
    actorX: new JSTFormControl(null),
    actorY: new JSTFormControl(null),
    actorLayerId: new JSTFormControl(null),
  });

  layersList: IJSTSelectItem[] = [];

  onApply(): void {
    if (this.formGroup.valid) {
      this.dialogRef?.close(this.formGroup.getRawValue());
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  setData(data: { scene: IScene; layersList: IJSTSelectItem[] }): void {
    if (data.scene) {
      this.formGroup.patchValue(data.scene);
    }
    if (data.layersList) {
      this.layersList = data.layersList;
    }
  }

  onClose(): void {
    this.dialogRef?.close();
  }
}
