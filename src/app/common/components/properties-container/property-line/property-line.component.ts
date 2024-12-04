import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { IJSTSelectItem, JSTInputModule, JSTSelectModule, JSTTouchspinModule } from '@jst/ui';

import { PropertyType, PropertyValueType } from '../../../interfaces';

@Component({
    selector: 'smc-property-line',
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatRadioModule,
        JSTInputModule,
        JSTTouchspinModule,
        JSTSelectModule,
    ],
    templateUrl: './property-line.component.html',
    styleUrl: './property-line.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SMCPropertyLineComponent {
  @Input() key!: string;

  @Input() type: PropertyType = 'string';

  @Input() value!: PropertyValueType;

  @Output() keyChange = new EventEmitter<string>();

  @Output() typeChange = new EventEmitter<PropertyType>();

  @Output() valueChange = new EventEmitter<PropertyValueType>();

  @Output() removeEvent = new EventEmitter<void>();

  @Output() changeEvent = new EventEmitter<void>();

  typesList: IJSTSelectItem[] = [
    {
      title: 'Строковое значение',
      value: 'string',
    },
    {
      title: 'Числовое значение',
      value: 'number',
    },
    {
      title: 'Логическое значение',
      value: 'boolean',
    },
  ];

  get keyValue(): string {
    return this.key;
  }

  set keyValue(value: string) {
    this.keyChange.emit(value);
    this.changeEvent.emit();
  }

  get typeValue(): PropertyType {
    return this.type;
  }

  set typeValue(value: PropertyType) {
    this.typeChange.emit(value);
    switch (value) {
      case 'string':
        this.valueValue = String(this.valueValue);
        break;
      case 'number':
        this.valueValue = Number(this.valueValue);
        break;
      case 'boolean':
        this.valueValue = Boolean(this.valueValue);
        break;
    }
    this.changeEvent.emit();
  }

  get valueValue(): PropertyValueType {
    return this.value;
  }

  set valueValue(value: PropertyValueType) {
    this.valueChange.emit(value);
    this.changeEvent.emit();
  }
}
