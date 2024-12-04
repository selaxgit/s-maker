export class HtmlHelper {
  public static blurActiveElement(): void {
    if (typeof (document.activeElement as HTMLElement).blur === 'function') {
      (document.activeElement as HTMLElement).blur();
    }
  }
}
