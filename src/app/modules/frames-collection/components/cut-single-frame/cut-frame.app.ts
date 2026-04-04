import { ISURect } from '@selax/utils';
import { DestroyOptions, RendererDestroyOptions } from 'pixi.js';

import { DrawRectContainer } from '~pixijs/containers/draw-rect.container';
import { ViewFileContainer } from '~pixijs/containers/view-file.container';
import { AppPixiStateEnum } from '~pixijs/interfaces';
import { PixiApp } from '~pixijs/pixi.app';

export class CutFrameApp extends PixiApp {
  onSelectedRect?: (rect: ISURect | null) => void;

  private readonly viewFileContainer = new ViewFileContainer();

  private readonly drawRectContainer = new DrawRectContainer();

  override destroy(rendererDestroyOptions: RendererDestroyOptions = false, options: DestroyOptions = false): void {
    this.viewFileContainer.destroy();
    this.drawRectContainer.destroy();
    super.destroy(rendererDestroyOptions, options);
  }

  override async initialize(element: HTMLElement): Promise<void> {
    await super.initialize(element);
    this.viewport.addChild(this.viewFileContainer);
    this.viewport.addChild(this.drawRectContainer);
    this.drawRectContainer.onSelectedRect = (rect: ISURect | null): void => this.onSelectedRect?.(rect);
  }

  override set state(value: AppPixiStateEnum) {
    this._state = value;
    this.setViewCursor();
    this.drawRectContainer.isDrawMode = value === AppPixiStateEnum.DrawRect;
  }

  async setFile(file: File): Promise<void> {
    await this.viewFileContainer.setFile(file);
    this.drawRectContainer.setRect(this.viewFileContainer.width, this.viewFileContainer.height);
  }
}
