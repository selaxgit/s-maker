import { Directive, ElementRef, inject, output } from '@angular/core';

import { SMCDragTypeEnum, SMCDropPositionEnum } from '~constants/drag.constants';
import { IDropInfo } from '~interfaces/drag.interface';
import { DragDropInfoService } from '~services/drag-drop-info.service';

const ABOVE_PERCENT = 0.1;
const BELOW_PERCENT = 0.9;
const DROP_ABOVE_CLASS = 'drop-above';
const DROP_BELOW_CLASS = 'drop-below';
const DROP_CENTER_CLASS = 'drop-center';

@Directive({
  selector: '[smcDropTreeNode]',
  host: {
    '(drop)': 'drop($event)',
    '(dragover)': 'onDragEnd($event)',
    '(dragleave)': 'onDragLeave()',
  },
})
export class SMCDropTreeNodeDirective {
  smcDropTreeNodeDragOverEvent = output<void>();

  smcDropTreeNodeDropEvent = output<IDropInfo>();

  private readonly elementRef = inject(ElementRef);

  private readonly dragDropInfoService = inject(DragDropInfoService);

  private dropPosition: SMCDropPositionEnum = SMCDropPositionEnum.Center;

  drop(event: DragEvent): void {
    (this.elementRef.nativeElement as HTMLElement).classList.remove(
      DROP_ABOVE_CLASS,
      DROP_BELOW_CLASS,
      DROP_CENTER_CLASS,
    );
    const dragInfo = this.dragDropInfoService.dragInfo;
    if (dragInfo) {
      event.preventDefault();
      this.smcDropTreeNodeDropEvent.emit({ dropPosition: this.dropPosition, dragInfo });
    }
  }

  onDragEnd(event: DragEvent): void {
    const dragInfo = this.dragDropInfoService.dragInfo;
    if (!dragInfo || ![SMCDragTypeEnum.TreeNode, SMCDragTypeEnum.Tile].includes(dragInfo.type)) {
      return;
    }

    if (dragInfo.type === SMCDragTypeEnum.TreeNode) {
      if (event.target && (event.target as HTMLElement).clientHeight > 0) {
        const percentageY = event.offsetY / (event.target as HTMLElement).clientHeight;
        if (0 <= percentageY && percentageY <= ABOVE_PERCENT) {
          (this.elementRef.nativeElement as HTMLElement).classList.remove(DROP_BELOW_CLASS, DROP_CENTER_CLASS);
          (this.elementRef.nativeElement as HTMLElement).classList.add(DROP_ABOVE_CLASS);
          this.dropPosition = SMCDropPositionEnum.Above;
        } else if (1 >= percentageY && percentageY >= BELOW_PERCENT) {
          (this.elementRef.nativeElement as HTMLElement).classList.remove(DROP_ABOVE_CLASS, DROP_CENTER_CLASS);
          (this.elementRef.nativeElement as HTMLElement).classList.add(DROP_BELOW_CLASS);
          this.dropPosition = SMCDropPositionEnum.Below;
        } else {
          (this.elementRef.nativeElement as HTMLElement).classList.remove(DROP_ABOVE_CLASS, DROP_BELOW_CLASS);
          (this.elementRef.nativeElement as HTMLElement).classList.add(DROP_CENTER_CLASS);
          this.dropPosition = SMCDropPositionEnum.Center;
        }
      }
      event.preventDefault();
      this.smcDropTreeNodeDragOverEvent.emit();
    } else if (dragInfo.type === SMCDragTypeEnum.Tile) {
      (this.elementRef.nativeElement as HTMLElement).classList.add(DROP_CENTER_CLASS);
      this.dropPosition = SMCDropPositionEnum.Center;
      event.preventDefault();
      this.smcDropTreeNodeDragOverEvent.emit();
    }
  }

  onDragLeave(): void {
    (this.elementRef.nativeElement as HTMLElement).classList.remove(
      DROP_ABOVE_CLASS,
      DROP_BELOW_CLASS,
      DROP_CENTER_CLASS,
    );
  }
}
