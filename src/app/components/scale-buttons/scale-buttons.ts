import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ZoomEnum } from '~pixijs/interfaces';

@Component({
  selector: 'smc-scale-buttons',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './scale-buttons.html',
  styleUrl: './scale-buttons.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SMCScaleButtons {
  readonly buttonColor = input<string>();

  readonly disabledButtons = input<boolean>(false);

  readonly zoomEvent = output<ZoomEnum>();

  readonly zoomEnum = ZoomEnum;

  handleZoom(zoom: ZoomEnum): void {
    this.zoomEvent.emit(zoom);
  }
}
