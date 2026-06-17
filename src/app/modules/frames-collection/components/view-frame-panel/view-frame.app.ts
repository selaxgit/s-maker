import { DestroyOptions, RendererDestroyOptions } from 'pixi.js';

import { ViewFileContainer } from '~pixijs/containers/view-file.container';
import { PixiApp } from '~pixijs/pixi.app';

export class ViewFrameApp extends PixiApp {
  private readonly viewFileContainer = new ViewFileContainer();

  override destroy(rendererDestroyOptions: RendererDestroyOptions = false, options: DestroyOptions = false): void {
    this.viewFileContainer.destroy();
    super.destroy(rendererDestroyOptions, options);
  }

  override async initialize(element: HTMLElement): Promise<void> {
    await super.initialize(element);
    this.viewport.addChild(this.viewFileContainer);
  }

  setFile(file: File): Promise<void> {
    return this.viewFileContainer.setFile(file);
  }
}
