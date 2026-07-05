import { ChangeDetectionStrategy, Component, effect, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SInputComponent, SSlidePanelContainerComponent, SSlidePanelExtendClass } from '@selax/ui';

import { SMCPropertiesContainer } from '~components/properties-container';
import { PropertiesType } from '~constants/common.constants';
import { IScene } from '~core/interfaces';

@Component({
  imports: [FormsModule, SSlidePanelContainerComponent, SInputComponent, SMCPropertiesContainer],
  templateUrl: './scene-properties-panel.html',
  styleUrl: './scene-properties-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SBOScenePropertiesPanel extends SSlidePanelExtendClass {
  readonly scene = input.required<IScene>();

  readonly sceneName = model<string>('');

  readonly properties = model<PropertiesType>({});

  private newProperties: PropertiesType = {};

  constructor() {
    super();
    effect(() => {
      const scene = this.scene();
      this.sceneName.set(scene.name);
      this.properties.set(scene.properties ?? {});
    });
  }

  handlePropertiesChangeEvent(properties: PropertiesType): void {
    this.newProperties = properties;
  }

  handleApply(): void {
    if (this.sceneName()) {
      this.closePanel({
        name: this.sceneName(),
        properties: this.newProperties,
      });
    }
  }

  handleClose(): void {
    this.closePanel(null);
  }
}
