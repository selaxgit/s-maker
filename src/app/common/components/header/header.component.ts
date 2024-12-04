import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';

import { TilesGridStore } from '../../../stores';
import { ScenesStore } from '../../../stores/scenes.store';
import { APP_MODULES } from '../../constants';
import { IProject, ISMModule, SMModeCodesEnum } from '../../interfaces';

@Component({
    selector: 'smc-header',
    imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule, RouterLink],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SMCHeaderComponent {
  @Input() project: IProject | null = null;

  @Input() currentModule: ISMModule | null = null;

  @Input() currentModulePage: string | null = null;

  modules: ISMModule[] = APP_MODULES;

  tilesGridEditorCode = SMModeCodesEnum.tilesGridEditor;

  sceneBuilderCode = SMModeCodesEnum.sceneBuilder;

  constructor(
    public readonly tilesGridStore: TilesGridStore,
    public readonly scenesStore: ScenesStore,
  ) {}
}
