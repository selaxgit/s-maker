import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SInputComponent, SSlidePanelContainerComponent, SSlidePanelExtendClass } from '@selax/ui';

import { SMCPropertiesContainer } from '~components/properties-container';
import { PropertiesType } from '~constants/common.constants';

export interface IObjectPropertiesPanelResult {
  name: string;
  properties: PropertiesType;
}

@Component({
  imports: [FormsModule, SSlidePanelContainerComponent, SInputComponent, SMCPropertiesContainer],
  templateUrl: './object-properties-panel.html',
  styleUrl: './object-properties-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SBObjectPropertiesPanel extends SSlidePanelExtendClass {
  readonly panelTitle = input<string>('Свойства объекта');

  readonly objectName = model<string>('');

  readonly properties = input<PropertiesType>({});

  private newProperties: PropertiesType = {};

  handlePropertiesChangeEvent(properties: PropertiesType): void {
    this.newProperties = properties;
  }

  handleApply(): void {
    this.closePanel({
      name: this.objectName(),
      properties: this.newProperties,
    });
  }

  handleClose(): void {
    this.closePanel(null);
  }
}
