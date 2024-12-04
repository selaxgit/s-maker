import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ScenesStore } from '../../../../../stores/scenes.store';
import { SBEditSidebarLasyerLineComponent } from './layer-line/layer-line.component';

@Component({
    selector: 'sb-edit-sidebar-objects-list',
    imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule, SBEditSidebarLasyerLineComponent],
    templateUrl: './objects-list.component.html',
    styleUrl: './objects-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SBEditSidebarObjectsListComponent {
  constructor(public readonly scenesStore: ScenesStore) {}
}
