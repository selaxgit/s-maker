import { Directive, ElementRef, inject, input } from '@angular/core';

import { IDragInfo } from '~interfaces/drag.interface';
import { DragDropInfoService } from '~services/drag-drop-info.service';

@Directive({
  selector: '[smcDrag]',
  host: {
    '(dragstart)': 'onDragStart($event)',
    '[attr.draggable]': 'getDraggable()',
  },
})
export class SMCDragDirective {
  readonly dragInfo = input<IDragInfo | null>(null, { alias: 'smcDrag' });

  readonly smcDragDisabled = input<boolean>(false);

  private readonly elementRef = inject(ElementRef);

  private readonly dragDropInfoService = inject(DragDropInfoService);

  // @_HostBinding('draggable')
  getDraggable(): boolean {
    return !this.smcDragDisabled();
  }

  // @_HostListener('dragstart', ['$event'])
  onDragStart(event: DragEvent): void {
    this.dragDropInfoService.dragInfo = this.dragInfo();
    const dt = event.dataTransfer;
    if (dt) {
      dt.setDragImage(this.elementRef.nativeElement, 0, 0);
    }
  }
}
