import { ISURect } from '@selax/utils';
import { Container, DestroyOptions, FederatedPointerEvent, Graphics, Point } from 'pixi.js';

export class DrawRectContainer extends Container {
  onSelectedRect?: (rect: ISURect | null) => void;

  isDrawMode = true;

  selectedRect: ISURect | null = null;

  private readonly gRect = new Graphics();

  private readonly gDrawRect = new Graphics();

  private mouseCoords: Point | null = null;

  constructor() {
    super();
    this.gRect.fillStyle = {
      color: 0xffffff,
      alpha: 0.01,
    };
    this.addChild(this.gRect);
    this.addChild(this.gDrawRect);
    this.initialize();
  }

  override destroy(options?: DestroyOptions): void {
    this.gRect.destroy();
    this.gDrawRect.destroy();
    super.destroy(options);
  }

  setRect(width: number, height: number): void {
    this.gRect.clear().rect(0, 0, width, height).fill();
  }

  private initialize(): void {
    this.eventMode = 'static';
    this.on('pointerdown', (e: FederatedPointerEvent) => {
      if (this.isDrawMode) {
        this.gDrawRect.clear();
        this.selectedRect = null;
        this.mouseCoords = this.toLocal<Point>({ x: e.globalX, y: e.globalY });
      }
    })
      .on('pointerup', (e: FederatedPointerEvent) => {
        if (this.mouseCoords && this.isDrawMode) {
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
          this.onSelectedRect?.(this.selectedRect);
        }
        this.mouseCoords = null;
      })
      .on('pointerleave', () => {
        this.mouseCoords = null;
      })
      .on('pointermove', (e: FederatedPointerEvent) => {
        if (this.mouseCoords && this.isDrawMode) {
          const coords = this.toLocal({ x: e.globalX, y: e.globalY });
          const width = Math.abs(coords.x - this.mouseCoords.x);
          const height = Math.abs(coords.y - this.mouseCoords.y);
          const x = Math.min(coords.x, this.mouseCoords.x);
          const y = Math.min(coords.y, this.mouseCoords.y);
          this.drawRect(x, y, width, height);
        }
      });
  }

  private drawRect(x: number, y: number, width: number, height: number): void {
    this.gDrawRect.clear().rect(x, y, width, height).stroke({ width: 1, color: 0x000000 });
  }
}
