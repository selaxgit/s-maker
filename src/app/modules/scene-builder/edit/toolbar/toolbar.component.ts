import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SMCScaleButtonsComponent } from '../../../../common/components';
import { ScenesStore } from '../../../../stores/scenes.store';

@Component({
    selector: 'sb-edit-toolbar',
    imports: [CommonModule, MatButtonModule, MatIconModule, SMCScaleButtonsComponent],
    templateUrl: './toolbar.component.html',
    styleUrl: './toolbar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SBEditToolbarComponent {
  constructor(public readonly scenesStore: ScenesStore) {}
}
