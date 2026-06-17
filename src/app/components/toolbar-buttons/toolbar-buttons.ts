import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AppPixiStateEnum, ZoomEnum } from '~pixijs/interfaces';

import { SMCScaleButtons } from '../scale-buttons';

@Component({
  selector: 'smc-toolbar-buttons',
  imports: [MatButtonModule, MatIconModule, MatDividerModule, MatTooltipModule, SMCScaleButtons],
  templateUrl: './toolbar-buttons.html',
  styleUrl: './toolbar-buttons.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SMCToolbarButtons {
  readonly moveButton = input<boolean>(true);

  readonly infoButton = input<boolean>(true);

  readonly dragObjectButton = input<boolean>(true);

  readonly removeObjectButton = input<boolean>(true);

  readonly drawRectButton = input<boolean>(true);

  readonly drawObjectButton = input<boolean>(true);

  readonly scaleButtons = input<boolean>(true);

  readonly disabledScaleButtons = input<boolean>(false);

  readonly state = input<AppPixiStateEnum>();

  readonly toolbarStateEvent = output<AppPixiStateEnum>();

  readonly zoomEvent = output<ZoomEnum>();

  readonly currentState = computed(() => this.state() ?? AppPixiStateEnum.Move);

  readonly appPixiState = AppPixiStateEnum;

  handleSetState(value: AppPixiStateEnum): void {
    this.toolbarStateEvent.emit(value);
  }

  handleZoom(value: ZoomEnum): void {
    this.zoomEvent.emit(value);
  }
}
