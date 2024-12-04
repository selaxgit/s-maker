import { Container, FederatedPointerEvent, Graphics, Point, Sprite, Texture } from 'pixi.js';

import { IRect } from '../../../../common/interfaces';

export class CutFrameContainer extends Container {
  public useMove = false;

  public selectedRect: IRect | null = null;

  private sprite!: Sprite;

  private mouseCoords: Point | null = null;

  private readonly gRect = new Graphics();

  constructor() {
    super();
    this.initialize();
  }

  public setFileCanvas(canvas: HTMLCanvasElement): void {
    if (this.sprite) {
      this.sprite.destroy(true);
    }
    this.sprite = new Sprite(Texture.from(canvas));
    this.addChild(this.sprite);
  }

  private initialize(): void {
    this.eventMode = 'static';
    this.sortableChildren = true;
    this.gRect.zIndex = 10;
    this.addChild(this.gRect);
    this.on('pointerdown', (e: FederatedPointerEvent) => {
      if (!this.useMove && this.sprite) {
        this.gRect.clear();
        this.selectedRect = null;
        this.mouseCoords = this.toLocal<Point>({ x: e.globalX, y: e.globalY });
      }
    });
    this.on('pointerup', (e: FederatedPointerEvent) => {
      if (this.mouseCoords && this.sprite) {
        const coords = this.toLocal({ x: e.globalX, y: e.globalY });
        const width = Math.abs(coords.x - this.mouseCoords.x);
        const height = Math.abs(coords.y - this.mouseCoords.y);
        const x = Math.min(coords.x, this.mouseCoords.x);
        const y = Math.min(coords.y, this.mouseCoords.y);
        if (width > 0 && height > 0) {
          this.selectedRect = { x, y, width, height };
        } else {
          this.selectedRect = null;
        }
      }
      this.mouseCoords = null;
    });
    this.on('pointerleave', () => {
      this.mouseCoords = null;
    });
    this.on('pointermove', (e: FederatedPointerEvent) => {
      if (!this.mouseCoords || !this.sprite) {
        return;
      }
      const coords = this.toLocal({ x: e.globalX, y: e.globalY });
      const width = Math.abs(coords.x - this.mouseCoords.x);
      const height = Math.abs(coords.y - this.mouseCoords.y);
      const x = Math.min(coords.x, this.mouseCoords.x);
      const y = Math.min(coords.y, this.mouseCoords.y);
      this.drawRect(x, y, width, height);
    });
  }

  private drawRect(x: number, y: number, width: number, height: number): void {
    this.gRect.clear().rect(x, y, width, height).stroke({ width: 1, color: 0x000000 });
  }
}
