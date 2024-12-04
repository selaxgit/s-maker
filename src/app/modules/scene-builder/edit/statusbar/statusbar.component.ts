import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ScenesStore } from '../../../../stores/scenes.store';

@Component({
    selector: 'sb-edit-statusbar',
    imports: [CommonModule],
    templateUrl: './statusbar.component.html',
    styleUrl: './statusbar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SBEditStatusbarComponent {
  constructor(public readonly scenesStore: ScenesStore) {}
}
