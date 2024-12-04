import { CdkMenuModule } from '@angular/cdk/menu';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { TilesGridStore } from '../../../../stores';

@Component({
    selector: 'tge-context-menu',
    imports: [CommonModule, CdkMenuModule, MatIconModule],
    templateUrl: './context-menu.component.html',
    styleUrl: './context-menu.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TGEContextMenuComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @ViewChild('menu', { static: true }) menu!: TemplateRef<any>;

  constructor(public readonly tilesGridStore: TilesGridStore) {}
}
