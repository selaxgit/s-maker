import { ChangeDetectionStrategy, Component, effect, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { ISelectOption, SInputComponent, SInputNumberComponent, SSelectComponent } from '@selax/ui';

import { IProperty, PropertyTypeEnum, PropertyValueType } from '~constants/common.constants';

@Component({
  selector: 'smc-property-line',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    SInputComponent,
    SSelectComponent,
    SInputNumberComponent,
  ],
  templateUrl: './property-line.html',
  styleUrl: './property-line.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SMCPropertyLineContainer {
  readonly propertyKey = model<string>('');

  readonly propertyType = model<PropertyTypeEnum>(PropertyTypeEnum.String);

  readonly propertyValue = model<PropertyValueType>('');

  readonly typesList: ISelectOption[] = [
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

  readonly changeLineEvent = output<IProperty>();

  readonly removeLineEvent = output<void>();

  constructor() {
    effect(() => {
      const key = this.propertyKey();
      const type = this.propertyType();
      const value = this.propertyValue();
      this.changeLineEvent.emit({ key, type, value });
    });
  }

  handleRemoveLine(): void {
    this.removeLineEvent.emit();
  }
}
