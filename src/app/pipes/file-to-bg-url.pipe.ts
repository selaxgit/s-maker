import { OnDestroy, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileToBgUrl',
  pure: false,
})
export class FileToBgUrlPipe implements PipeTransform, OnDestroy {
  private currentFile: File | null = null;

  private currentObjectURL: string | null = null;

  transform(file: File | null): string {
    if (!file) {
      this.revoke();
      return 'none';
    }
    if (file === this.currentFile) {
      return `url(${this.currentObjectURL})`;
    }
    this.revoke();
    this.currentFile = file;
    this.currentObjectURL = URL.createObjectURL(file);
    return `url(${this.currentObjectURL})`;
  }

  ngOnDestroy(): void {
    this.revoke();
  }

  private revoke(): void {
    if (this.currentObjectURL) {
      URL.revokeObjectURL(this.currentObjectURL);
      this.currentObjectURL = null;
      this.currentFile = null;
    }
  }
}
