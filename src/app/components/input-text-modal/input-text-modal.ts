import { AfterViewInit, ChangeDetectionStrategy, Component, input, OnInit, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { SInputComponent } from '@selax/ui';

const DEF_LABEL = 'Наименование';
const DEF_APPLYTEXT = 'Применить';

@Component({
  imports: [MatButtonModule, ReactiveFormsModule, SInputComponent],
  templateUrl: './input-text-modal.html',
  styleUrl: './input-text-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SMCInputTextModal implements OnInit, AfterViewInit {
  readonly label = input<string>(DEF_LABEL);

  readonly applyTitle = input<string>(DEF_APPLYTEXT);

  readonly value = input<string | null>(null);

  readonly controlValue = new FormControl<string | null>(null, Validators.required);

  dialogRef!: MatDialogRef<SMCInputTextModal>;

  readonly inputElementRef = viewChild<SInputComponent>('inputElement');

  ngOnInit(): void {
    this.controlValue.setValue(this.value());
  }

  ngAfterViewInit(): void {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    setTimeout(() => this.inputElementRef()?.focus(), 200);
  }

  onApply(): void {
    if (this.controlValue.valid) {
      this.dialogRef?.close(this.controlValue.value);
    } else {
      this.controlValue.markAsTouched();
    }
  }

  onClose(): void {
    this.dialogRef?.close();
  }
}
