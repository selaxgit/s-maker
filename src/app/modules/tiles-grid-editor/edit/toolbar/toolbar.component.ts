import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SMCScaleButtonsComponent } from '../../../../common/components';
import { TilesGridStore } from '../../../../stores';

@Component({
    selector: 'tge-edit-toolbar',
    imports: [CommonModule, MatButtonModule, MatIconModule, SMCScaleButtonsComponent],
    templateUrl: './toolbar.component.html',
    styleUrl: './toolbar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TGEEditToolbarComponent {
  constructor(public readonly tilesGridStore: TilesGridStore) {}
}
