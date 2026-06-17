import { ISUCoords } from '@selax/utils';
import {
  Application,
  Container,
  DestroyOptions,
  FederatedPointerEvent,
  Rectangle,
  RendererDestroyOptions,
} from 'pixi.js';

import { AppPixiStateEnum, VIEWPORT_MAX_SCALE, VIEWPORT_MIN_SCALE, ZoomEnum } from '~pixijs/interfaces';

export interface IDragStart {
  mouseX: number;
  mouseY: number;
  objectX?: number;
  objectY?: number;
  objectWidth?: number;
  objectHeight?: number;
}

export class PixiApp extends Application {
  onMouseMove: ((coords: ISUCoords) => void) | null = null;

  protected _isInitialized = false;

  protected resizeObserver: ResizeObserver | null = null;

  protected viewport = new Container();

  protected _state: AppPixiStateEnum = AppPixiStateEnum.None;

  protected _scale = 1;

  protected _isDragging = false;

  protected _dragStart: IDragStart | null = null;

  protected _centeredAfterScale: boolean = false;

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  get centeredAfterScale(): boolean {
    return this._centeredAfterScale;
  }

  set centeredAfterScale(value: boolean) {
    this._centeredAfterScale = value;
  }

  get state(): AppPixiStateEnum {
    return this._state;
  }

  set state(value: AppPixiStateEnum) {
    this._state = value;
    this.setViewCursor();
  }

  setZoom(zoom: ZoomEnum, centerX: number | null = null, centerY: number | null = null): void {
    if (centerX === null) {
      centerX = this.screen.width / 2;
    }
    if (centerY === null) {
      centerY = this.screen.height / 2;
    }
    const oldScale = this._scale;
    switch (zoom) {
      case ZoomEnum.In:
        this._scale += 0.1;
        if (this._scale > VIEWPORT_MAX_SCALE) {
          this._scale = VIEWPORT_MAX_SCALE;
        }
        break;
      case ZoomEnum.Out:
        this._scale -= 0.1;
        if (this._scale < VIEWPORT_MIN_SCALE) {
          this._scale = VIEWPORT_MIN_SCALE;
        }
        break;
      default:
        this._scale = 1;
        this.viewport.scale.set(this._scale);
        this.viewport.position.set(0);
        if (this._centeredAfterScale) {
          this.setCenteredViewport();
        }
        return;
    }
    this.viewport.scale.x = this._scale;
    this.viewport.scale.y = this._scale;
    const worldPos = { x: centerX, y: centerY };
    const localPos = this.viewport.toLocal(worldPos);
    const x = this.viewport.x + localPos.x * (oldScale - this._scale);
    const y = this.viewport.y + localPos.y * (oldScale - this._scale);
    this.viewport.x = x > 0 || this.viewport.width < this.screen.width ? 0 : x;
    this.viewport.y = y > 0 || this.viewport.height < this.screen.height ? 0 : y;
    if (this._centeredAfterScale) {
      this.setCenteredViewport();
    }
  }

  setCenteredViewport(): void {
    const x = (this.screen.width - this.viewport.width) / 2;
    const y = (this.screen.height - this.viewport.height) / 2;
    this.viewport.position.set(x, y);
  }

  async initialize(element: HTMLElement): Promise<void> {
    const screenBox = element.getBoundingClientRect();
    await this.init({
      width: screenBox.width,
      height: screenBox.height,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio,
      antialias: true,
      resizeTo: element,
    });
    element.appendChild(this.canvas);
    this.resize();
    this.resizeObserver = new ResizeObserver(() => {
      this.stage.hitArea = new Rectangle(0, 0, this.canvas.width, this.canvas.height);
    });
    this.resizeObserver.observe(element);
    this.stage.addChild(this.viewport);
    this.setViewCursor();
    this.setupInteractivity();
    this._isInitialized = true;
  }

  override destroy(rendererDestroyOptions: RendererDestroyOptions = false, options: DestroyOptions = false): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    super.destroy(rendererDestroyOptions, options);
  }

  protected setViewCursor(): void {
    if (!this._isInitialized) {
      return;
    }
    let cursor = 'default';
    switch (this._state) {
      case AppPixiStateEnum.DragObject:
        cursor = 'alias';
        break;
      case AppPixiStateEnum.Info:
        cursor = 'help';
        break;
      case AppPixiStateEnum.Move:
        cursor = 'move';
        break;
      case AppPixiStateEnum.DrawRect:
      case AppPixiStateEnum.RemoveObject:
        cursor = 'crosshair';
        break;
      case AppPixiStateEnum.DrawObject:
        cursor = 'grabbing';
        break;
    }
    this.renderer.events.cursorStyles['default'] = cursor;
    this.canvas.style.cursor = cursor;
  }

  protected setupInteractivity(): void {
    // Обработка колесика мыши для масштабирования
    this.canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        this.setZoom(ZoomEnum.Out, e.offsetX, e.offsetY);
      } else {
        this.setZoom(ZoomEnum.In, e.offsetX, e.offsetY);
      }
    });
    // события мыши
    this.stage.eventMode = 'static';
    this.stage
      .on('pointerdown', (e: FederatedPointerEvent) => this.onPointerDown(e))
      .on('pointermove', (e: FederatedPointerEvent) => this.onPointerMove(e))
      .on('pointerup', () => this.onPointerUp())
      .on('pointerleave', () => this.onPointerLeave());
  }

  protected onPointerDown(e: FederatedPointerEvent): void {
    const pos = e.global;
    this._dragStart = { mouseX: pos.x, mouseY: pos.y };
    this._isDragging = true;
  }

  protected onPointerMove(e: FederatedPointerEvent): void {
    if (typeof this.onMouseMove === 'function' && this.stage.children.length > 0) {
      const point = e.getLocalPosition(this.stage.children[0]);
      this.onMouseMove({ x: Math.trunc(point.x), y: Math.trunc(point.y) });
    }
    switch (this._state) {
      case AppPixiStateEnum.Move:
        if (this._isDragging && this._dragStart) {
          const pos = e.global;
          const dx = pos.x - this._dragStart.mouseX;
          const dy = pos.y - this._dragStart.mouseY;
          let x = this.viewport.x + dx > 0 ? 0 : this.viewport.x + dx;
          let y = this.viewport.y + dy > 0 ? 0 : this.viewport.y + dy;
          if (x + this.viewport.width < this.screen.width) {
            x = this.screen.width - this.viewport.width;
          }
          if (y + this.viewport.height < this.screen.height) {
            y = this.screen.height - this.viewport.height;
          }
          this.viewport.x = x > 0 ? 0 : x;
          this.viewport.y = y > 0 ? 0 : y;
          this._dragStart = { mouseX: pos.x, mouseY: pos.y };
        }
        break;
    }
  }

  protected onPointerUp(): void {
    this._isDragging = false;
    this._dragStart = null;
  }

  protected onPointerLeave(): void {
    this._isDragging = false;
    this._dragStart = null;
  }
}
