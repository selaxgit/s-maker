import { ChangeDetectionStrategy, Component, computed, effect, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';

import { IProperty, PropertiesType, PropertyTypeEnum, ReplaceTilePropertiesEnum } from '~constants/common.constants';

import { SMCPropertyLineContainer } from './components/property-line';

@Component({
  selector: 'smc-properties-container',
  imports: [FormsModule, MatButtonModule, MatRadioModule, SMCPropertyLineContainer],
  templateUrl: './properties-container.html',
  styleUrl: './properties-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SMCPropertiesContainer {
  readonly replaceType = model<ReplaceTilePropertiesEnum>();

  readonly replaceTypeEnum = ReplaceTilePropertiesEnum;

  readonly visibleReplaceType = input<boolean>(true);

  readonly properties = input<PropertiesType>({});

  readonly propertyList = signal<IProperty[]>([]);

  readonly propertiesToType = computed(() => {
    const list = this.propertyList();
    const values: PropertiesType = {};
    list.forEach((item: IProperty) => {
      values[item.key] = {
        type: item.type,
        value: item.value,
      };
    });
    return values;
  });

  readonly propertiesChangeEvent = output<PropertiesType>();

  constructor() {
    effect(() => this.propertiesToList(this.properties()));
    effect(() => this.propertiesChangeEvent.emit(this.propertiesToType()));
  }

  handleRemoveLine(idx: number): void {
    this.propertyList.update((list: IProperty[]) => {
      list.splice(idx, 1);
      return [...list];
    });
  }

  handleChangeLine(idx: number, fields: IProperty): void {
    this.propertyList.update((list: IProperty[]) => {
      if (list[idx] === undefined) {
        return list;
      }
      list[idx] = fields;
      return [...list];
    });
  }

  handleAddProperty(): void {
    this.propertyList.update((list: IProperty[]) => {
      list.push({
        key: '',
        type: PropertyTypeEnum.String,
        value: '',
      });
      return [...list];
    });
  }

  private propertiesToList(properties: PropertiesType): void {
    const props: IProperty[] = [];
    for (const [key, value] of Object.entries(properties)) {
      props.push({
        key,
        type: value.type,
        value: value.value,
      });
    }
    this.propertyList.set(props);
  }
}
