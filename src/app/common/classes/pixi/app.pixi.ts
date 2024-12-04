import { Application, Container, Rectangle } from 'pixi.js';

import { ICoords, IWidthHeight, ZoomType } from '../../interfaces';

interface IMouseState {
  left: number;
  top: number;
  x: number;
  y: number;
}

const DEF_MIN_SCALE = 0.1;
const DEF_MAX_SCALE = 20;

export class AppPixi {
  public useScale = false;

  public useMove = false;

  public minScale = DEF_MIN_SCALE;

  public maxScale = DEF_MAX_SCALE;

  public onZoomDone: (() => void) | null = null;

  public onMoveDone: (() => void) | null = null;

  protected app = new Application();

  protected containerElement: HTMLDivElement | null = null;

  protected scaleScene = 1;

  protected mouseState: IMouseState | null = null;

  protected scaleContainer: Container | null = null;

  protected mouseCoords: ICoords | null = null;

  private resizeObserver: ResizeObserver | null = null;

  public get screenWidth(): number {
    return this.app.screen.width;
  }

  public get screenHeight(): number {
    return this.app.screen.height;
  }

  public setZoom(value: ZoomType = 'default', offsetByMouse: boolean = false): void {
    if (!this.useScale || !this.scaleContainer) {
      return;
    }
    let holdWidthHeight: IWidthHeight | null = null;
    if (this.mouseCoords && offsetByMouse) {
      holdWidthHeight = {
        width: this.scaleContainer.width,
        height: this.scaleContainer.height,
      };
    }
    switch (value) {
      case 'in':
        this.scaleScene += 0.1;
        if (this.scaleScene > this.maxScale) {
          this.scaleScene = this.maxScale;
        }
        break;
      case 'out':
        this.scaleScene -= 0.05;
        if (this.scaleScene < this.minScale) {
          this.scaleScene = this.minScale;
        }
        break;
      default:
        this.scaleScene = 1;
        this.scaleContainer.x = 0;
        this.scaleContainer.y = 0;
    }
    this.setScaleContainer(this.scaleScene, this.scaleScene);
    if (this.mouseCoords && offsetByMouse) {
      const offsetX = (this.mouseCoords.x * this.scaleContainer.width) / (holdWidthHeight?.width ?? 1);
      const offsetY = (this.mouseCoords.y * this.scaleContainer.height) / (holdWidthHeight?.height ?? 1);
      let toX = this.scaleContainer.x - (offsetX - this.mouseCoords.x);
      if (toX > 0) {
        toX = 0;
      }
      let toY = this.scaleContainer.y - (offsetY - this.mouseCoords.y);
      if (toY > 0) {
        toY = 0;
      }
      this.scaleContainer.x = toX;
      this.scaleContainer.y = toY;
    }
    if (typeof this.onZoomDone === 'function') {
      this.onZoomDone();
    }
  }

  private setScaleContainer(scaleX: number, scaleY: number): void {
    if (this.scaleContainer) {
      this.scaleContainer.scale.set(scaleX, scaleY);
    }
  }

  public attachScaleContainer(container: Container): void {
    this.scaleContainer = container;
    this.app.stage.addChild(this.scaleContainer);
  }

  public async initialize(parentElement: HTMLDivElement): Promise<void> {
    this.containerElement = parentElement;
    const screenBox = this.containerElement.getBoundingClientRect();
    await this.app.init({
      width: screenBox.width,
      height: screenBox.height,
      backgroundAlpha: 0,
    });
    this.containerElement.appendChild(this.app.canvas);
    this.app.resizeTo = this.containerElement;
    this.app.resize();
    this.containerElement.addEventListener('wheel', this.onWheel);
    this.containerElement.addEventListener('mousemove', this.onMouseMove);
    this.containerElement.addEventListener('mousedown', this.onMouseDown);
    this.containerElement.addEventListener('mouseup', this.onMouseUp);
    this.containerElement.addEventListener('mouseleave', this.onMouseLeave);
    this.resizeObserver = new ResizeObserver(() => {
      if (this.containerElement) {
        const rect = this.containerElement.getBoundingClientRect();
        this.app.stage.hitArea = new Rectangle(0, 0, rect.width, rect.height);
      }
    });
    this.resizeObserver.observe(this.containerElement);
  }

  public destroy(): void {
    if (this.app) {
      this.app.destroy(true, {
        children: true,
        texture: true,
      });
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.containerElement) {
      this.containerElement.removeEventListener('wheel', this.onWheel);
      this.containerElement.removeEventListener('mousemove', this.onMouseMove);
      this.containerElement.removeEventListener('mousedown', this.onMouseDown);
      this.containerElement.removeEventListener('mouseup', this.onMouseUp);
      this.containerElement.removeEventListener('mouseleave', this.onMouseLeave);
    }
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (!this.scaleContainer) {
      return;
    }
    this.mouseState = {
      left: this.scaleContainer.x,
      top: this.scaleContainer.y,
      x: e.clientX,
      y: e.clientY,
    };
  };

  private onMouseUp = (): void => this.onMouseLeave();

  private onMouseLeave = (): void => {
    if (this.mouseState && this.useMove && this.scaleContainer && typeof this.onMoveDone === 'function') {
      this.onMoveDone();
    }
    this.mouseState = null;
  };

  private onMouseMove = (e: MouseEvent): void => {
    this.mouseCoords = { x: e.pageX, y: e.pageY };
    if (this.mouseState && this.useMove && this.scaleContainer) {
      if (this.scaleContainer.width >= this.app.screen.width) {
        let x = this.mouseState.left + (e.pageX - this.mouseState.x);
        if (x > 1) {
          x = 1;
        }
        if (x + this.scaleContainer.width < this.app.screen.width) {
          x = this.app.screen.width - this.scaleContainer.width;
        }
        this.scaleContainer.x = x;
      }
      if (this.scaleContainer.height >= this.app.screen.height) {
        let y = this.mouseState.top + (e.pageY - this.mouseState.y);
        if (y > 0) {
          y = 0;
        }
        if (y + this.scaleContainer.height < this.app.screen.height) {
          y = this.app.screen.height - this.scaleContainer.height;
        }
        this.scaleContainer.y = y;
      }
    }
  };

  private onWheel = (e: WheelEvent): void => {
    if (!this.useScale) {
      return;
    }
    if (e.deltaY > 0) {
      this.setZoom('out', true);
    } else {
      this.setZoom('in', true);
    }
  };
}
