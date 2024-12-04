import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ZoomType } from '../../interfaces';

@Component({
    selector: 'smc-scale-buttons',
    imports: [MatIconModule, MatButtonModule],
    templateUrl: './scale-buttons.component.html',
    styleUrl: './scale-buttons.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SMCScaleButtonsComponent {
  @Input() buttonColor: string | undefined = undefined;

  @Output() zoomEvent = new EventEmitter<ZoomType>();

  onZoom(zoom: ZoomType): void {
    this.zoomEvent.emit(zoom);
  }
}
