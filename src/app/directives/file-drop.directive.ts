import { DestroyRef, Directive, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SUFileHelper } from '@selax/utils';

@Directive({
  selector: '[smcFileDrop]',
  host: {
    '[class.smc-file-drop-hover]': 'fileDropHoverClass',
    '(dblclick)': 'onDblClick()',
    '(click)': 'onClick()',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class SMFileDropDirective {
  readonly smcFileDropCanDrop = input<boolean>(true);

  readonly smcFileDropClickChoice = input<'click' | 'dblClick' | 'none'>('none');

  readonly smcFileDropMultiFile = input<boolean>(false);

  readonly smcFileDropAccept = input<string>('*');

  readonly smcFileDropEvent = output<File[]>();

  protected fileDropHoverClass = false;

  private readonly destroyRef = inject(DestroyRef);

  onDblClick(): void {
    if (this.smcFileDropClickChoice() === 'dblClick') {
      this.openFiles();
    }
  }

  onClick(): void {
    if (this.smcFileDropClickChoice() === 'click') {
      this.openFiles();
    }
  }

  onDragOver(evt: DragEvent): void {
    evt.preventDefault();
    evt.stopPropagation();
    if (this.smcFileDropCanDrop()) {
      this.fileDropHoverClass = true;
    }
  }

  onDragLeave(evt: DragEvent): void {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileDropHoverClass = false;
  }

  onDrop(evt: DragEvent): void {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileDropHoverClass = false;
    if (this.smcFileDropCanDrop()) {
      const files = evt.dataTransfer?.files;
      if (files && files.length > 0) {
        this.smcFileDropEvent.emit(Array.from(files));
      }
    }
  }

  private openFiles(): void {
    SUFileHelper.uploadFile(this.smcFileDropAccept(), this.smcFileDropMultiFile())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((files: FileList | File) => {
        const value: File[] = [];
        if (this.smcFileDropMultiFile() && files instanceof FileList) {
          for (let i = 0; i < (files as FileList).length; i++) {
            const file = (files as FileList).item(i);
            if (file) {
              value.push(file);
            }
          }
        } else {
          value.push(files as File);
        }
        this.smcFileDropEvent.emit(value);
      });
  }
}
