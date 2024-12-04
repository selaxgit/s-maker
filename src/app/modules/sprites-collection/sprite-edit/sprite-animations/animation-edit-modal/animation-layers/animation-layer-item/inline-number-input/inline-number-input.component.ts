/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Decimal from 'decimal.js';
import { interval, takeWhile } from 'rxjs';

const TIMEOUT_AUTO = 500;
const STEP = 0.01;

@Component({
    selector: 'sc-inline-number-input',
    imports: [CommonModule, MatButtonModule, MatIconModule, FormsModule],
    templateUrl: './inline-number-input.component.html',
    styleUrl: './inline-number-input.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SCInlineNumberInputComponent {
  @Input() set value(val: number | null) {
    this.viewValue = val;
  }

  @Output() valueChange = new EventEmitter<number | null>();

  viewValue: number | null = null;

  private processing = false;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  onChange(): void {
    if (!this.hasViewValue()) {
      this.valueChange.emit(null);
    }
    if (Number(this.viewValue) > 10) {
      this.viewValue = 10;
    }
    this.valueChange.emit(this.viewValue);
  }

  onTextKeyDown(e: KeyboardEvent): void {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ArrowUp', 'Backspace', 'Delete'].includes(e.key)) {
      return;
    }
    if (e.key === '.') {
      if (!this.hasViewValue() || String(this.viewValue).indexOf('.') >= 0) {
        e.preventDefault();
      }
      return;
    }
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  }

  public onSelectText(e: FocusEvent): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e.target as any)?.select();
  }

  onIncrementMouseDown(): void {
    this.processing = true;
    setTimeout(() => this.autoIncrement(), TIMEOUT_AUTO);
  }

  onDecrementMouseDown(): void {
    this.processing = true;
    setTimeout(() => this.autoDecrement(), TIMEOUT_AUTO);
  }

  onIncrementClick(): void {
    this.processing = false;
    this.increment();
  }

  onDecrementClick(): void {
    this.processing = false;
    this.decrement();
  }

  onStop(): void {
    if (this.processing) {
      this.processing = false;
    }
  }

  private autoIncrement(): void {
    interval(100)
      .pipe(takeWhile(() => this.processing))
      .subscribe(() => {
        if (this.processing) {
          this.increment();
        }
      });
  }

  private autoDecrement(): void {
    interval(100)
      .pipe(takeWhile(() => this.processing))
      .subscribe(() => {
        if (this.processing) {
          this.decrement();
        }
      });
  }

  private increment(): void {
    let value = this.viewValue ? new Decimal(this.viewValue) : new Decimal(0);
    value = value.plus(STEP);
    if (value.greaterThan(10)) {
      this.viewValue = 10;
    } else {
      this.viewValue = Number(value.toFixed(3));
    }
    this.cdr.detectChanges();
    if (!this.processing) {
      this.onChange();
    }
  }

  private decrement(): void {
    let value = this.viewValue ? new Decimal(this.viewValue) : new Decimal(0);
    value = value.minus(STEP);
    if (value.lessThan(0)) {
      this.viewValue = 0;
    } else {
      this.viewValue = Number(value.toFixed(3));
    }
    this.cdr.detectChanges();
    if (!this.processing) {
      this.onChange();
    }
  }

  private hasViewValue(): boolean {
    return ![null, '', undefined].includes(this.viewValue as any);
  }
}
