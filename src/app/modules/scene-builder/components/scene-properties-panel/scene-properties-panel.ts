import { ChangeDetectionStrategy, Component, effect, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SInputComponent,
  SInputNumberComponent,
  SSlidePanelContainerComponent,
  SSlidePanelExtendClass,
} from '@selax/ui';

import { IScene } from '~core/interfaces';

@Component({
  imports: [FormsModule, SSlidePanelContainerComponent, SInputComponent, SInputNumberComponent],
  templateUrl: './scene-properties-panel.html',
  styleUrl: './scene-properties-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SBOScenePropertiesPanel extends SSlidePanelExtendClass {
  readonly scene = input.required<IScene>();

  readonly sceneName = model<string>('');

  readonly offsetX = model<number | null>(null);

  readonly offsetY = model<number | null>(null);

  readonly sceneWidth = model<number | null>(null);

  readonly sceneHeight = model<number | null>(null);

  constructor() {
    super();
    effect(() => {
      const scene = this.scene();
      this.sceneName.set(scene.name);
      this.offsetX.set(scene.offsetX);
      this.offsetY.set(scene.offsetY);
      this.sceneWidth.set(scene.width);
      this.sceneHeight.set(scene.height);
    });
  }

  handleApply(): void {
    if (this.sceneName()) {
      this.closePanel({
        name: this.sceneName(),
        offsetX: this.offsetX(),
        offsetY: this.offsetY(),
        width: this.sceneWidth(),
        height: this.sceneHeight(),
      });
    }
  }

  handleClose(): void {
    this.closePanel(null);
  }
}
