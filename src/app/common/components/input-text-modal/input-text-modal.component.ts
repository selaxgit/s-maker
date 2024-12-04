import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { JSTFormControl, JSTInputModule } from '@jst/ui';

interface IInputTextModalData {
  label: string;
  applyTitle: string;
  value?: string;
}

const DEF_LABEL = 'Наименование';
const DEF_APPLYTEXT = 'Применить';

@Component({
    selector: 'sm-input-text-modal',
    imports: [MatButtonModule, JSTInputModule],
    templateUrl: './input-text-modal.component.html',
    styleUrl: './input-text-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SMCInputTextModalComponent {
  dialogRef!: MatDialogRef<SMCInputTextModalComponent>;

  label = DEF_LABEL;

  applyTitle = DEF_APPLYTEXT;

  controlValue = new JSTFormControl(null, Validators.required);

  setData(data: IInputTextModalData): void {
    this.label = data.label ?? DEF_LABEL;
    this.applyTitle = data.applyTitle ?? DEF_APPLYTEXT;
    if (data.value) {
      this.controlValue.setValue(data.value);
    }
  }

  onApply(): void {
    if (this.controlValue.valid) {
      this.dialogRef?.close(this.controlValue.value);
    }
  }

  onClose(): void {
    this.dialogRef?.close();
  }
}
