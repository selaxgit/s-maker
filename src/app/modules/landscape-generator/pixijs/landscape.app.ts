import { DestroyOptions, Graphics, RendererDestroyOptions } from 'pixi.js';

import { PixiApp } from '~pixijs/pixi.app';

import { BIOME_COLORS, ILandscape, LandscapeType } from '../constants';

const CELL_WIDTH = 10;
const CELL_HEIGHT = 10;

export class LandscapeApp extends PixiApp {
  private readonly gMap = new Graphics();

  override destroy(rendererDestroyOptions: RendererDestroyOptions = false, options: DestroyOptions = false): void {
    this.gMap.destroy();
    super.destroy(rendererDestroyOptions, options);
  }

  override async initialize(element: HTMLElement): Promise<void> {
    await super.initialize(element);
    this.viewport.addChild(this.gMap);
  }

  drawMap(map: LandscapeType): void {
    this.gMap.clear();
    let x = 0;
    for (const row of map) {
      let y = 0;
      for (const cell of row) {
        this.drawCell(x, y, cell);
        y++;
      }
      x++;
    }
  }

  private drawCell(x: number, y: number, cell: ILandscape): void {
    this.gMap
      .rect(x * CELL_WIDTH, y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT)
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      .fill({ color: BIOME_COLORS[cell.biome] ?? 0xff0000 });
  }
}
