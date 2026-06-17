import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SMCToolbarButtons } from '~components/toolbar-buttons';
import { EditSceneStore } from '~core/stores';

import { SBDrawPixi } from '../draw-pixi';

@Component({
  selector: 'sb-draw-container',
  imports: [SMCToolbarButtons, SBDrawPixi],
  templateUrl: './draw-container.html',
  styleUrl: './draw-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SBDrawContainer {
  readonly editSceneStore = inject(EditSceneStore);
}
