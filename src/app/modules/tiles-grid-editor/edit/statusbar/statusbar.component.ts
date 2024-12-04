import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TilesGridStore } from '../../../../stores';

@Component({
    selector: 'tge-edit-statusbar',
    imports: [CommonModule],
    templateUrl: './statusbar.component.html',
    styleUrl: './statusbar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TGEEditStatusbarComponent {
  constructor(public readonly tilesGridStore: TilesGridStore) {}
}
