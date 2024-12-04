/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Container, Graphics } from 'pixi.js';

import { BiomeColors, ILandscape, LandscapeType } from '../../../../common/interfaces';

const CELL_WIDTH = 10;
const CELL_HEIGHT = 10;

export class DrawContainer extends Container {
  private readonly gMap = new Graphics();

  constructor() {
    super();
    this.addChild(this.gMap);
  }

  public drawMap(map: LandscapeType): void {
    this.gMap.clear();
    let x = 0;
    let y = 0;
    for (const row of map) {
      y = 0;
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
      .fill({ color: BiomeColors[cell.biome] ?? 0xff0000 });
  }
}
