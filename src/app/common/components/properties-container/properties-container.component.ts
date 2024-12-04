import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';

import { IProperties, PropertyType, PropertyValueType, ReplaceTilePropertiesType } from '../../interfaces';
import { SMCPropertyLineComponent } from './property-line/property-line.component';

interface IProperty {
  key: string;
  type: PropertyType;
  value: PropertyValueType;
}

@Component({
    selector: 'smc-properties-container',
    imports: [CommonModule, FormsModule, MatButtonModule, MatRadioModule, SMCPropertyLineComponent],
    templateUrl: './properties-container.component.html',
    styleUrl: './properties-container.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SMCPropertiesContainerComponent {
  @Input() set properties(value: IProperties) {
    const props: IProperty[] = [];
    Object.keys(value).forEach((key: string) => {
      props.push({
        key,
        type: value[key].type,
        value: value[key].value,
      });
    });
    this.propertiesList.set(props);
  }

  @Input() replaceType: ReplaceTilePropertiesType = 'add';

  @Input() replacerVisible = false;

  @Output() changeEvent = new EventEmitter<IProperties>();

  @Output() replaceTypeChange = new EventEmitter<ReplaceTilePropertiesType>();

  propertiesList: WritableSignal<IProperty[]> = signal([]);

  get replaceTypeValue(): string {
    return this.replaceType;
  }

  set replaceTypeValue(value: ReplaceTilePropertiesType) {
    this.replaceTypeChange.emit(value);
  }

  onChange(): void {
    this.changeEvent.emit(this.toProperties(this.propertiesList()));
  }

  onRemoveProperty(idx: number): void {
    this.propertiesList.update((value: IProperty[]) => {
      value.splice(idx, 1);
      return value;
    });
    this.changeEvent.emit(this.toProperties(this.propertiesList()));
  }

  onAddProperty(): void {
    this.propertiesList.update((value: IProperty[]) => {
      value.push({
        key: '',
        type: 'string',
        value: '',
      });
      return value;
    });
  }

  private toProperties(props: IProperty[]): IProperties {
    const ret: IProperties = {};
    props.forEach((p: IProperty) => {
      if (p.key) {
        ret[p.key] = { type: p.type, value: p.value };
      }
    });
    return ret;
  }
}
