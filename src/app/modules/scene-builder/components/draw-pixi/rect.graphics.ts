/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ISUCoords, ISURect, ISUWidthHeight } from '@selax/utils';
import { FederatedPointerEvent, Graphics } from 'pixi.js';

import { ISceneObjectEventsGround } from '~core/interfaces';

import { ALPHA_RECT_VALUE, ResizeCursorType, SELECT_OBJECT_COLOR } from './constants';
import { IObjectRectGraphicsData, ISceneDragObject } from './interfaces';

export interface IRectGraphicsEvent {
  object: RectGraphics;
  data: IObjectRectGraphicsData;
}

export class RectGraphics extends Graphics implements ISceneDragObject {
  onObjectMouseMove: ((info: IRectGraphicsEvent) => void) | null = null;

  onObjectMouseLeave: (() => void) | null = null;

  private currentRect: ISURect = { x: 0, y: 0, width: 0, height: 0 };

  private isSelected = false;

  constructor(
    readonly guidObject: string,
    readonly bgColor: number,
  ) {
    super();
    this.eventMode = 'static';
    this.cursor = 'default';
    this.on('pointermove', (e: FederatedPointerEvent) => {
      if (typeof this.onObjectMouseMove === 'function') {
        const cursor = this.getCursor(e);
        if (cursor) {
          this.onObjectMouseMove({
            object: this,
            data: {
              cursor,
              mode: cursor === 'move' ? 'drag' : 'resize',
            },
          });
        }
      }
    }).on('pointerleave', () => {
      if (typeof this.onObjectMouseLeave === 'function') {
        this.onObjectMouseLeave();
      }
    });
  }

  selectedObject(selected: boolean): void {
    if (selected) {
      this.drawCurrentRect(SELECT_OBJECT_COLOR);
    } else if (this.isSelected) {
      this.drawCurrentRect();
    }
    this.isSelected = selected;
  }

  updateObject(object: ISceneObjectEventsGround): void {
    this.visible = object.visible;
    const rect = { x: object.x, y: object.y, width: object.width ?? 25, height: object.height ?? 25 };
    if (JSON.stringify(rect) !== JSON.stringify(this.currentRect)) {
      this.currentRect = rect;
      this.drawCurrentRect();
    }
  }

  getX(): number {
    return this.currentRect.x;
  }

  getY(): number {
    return this.currentRect.y;
  }

  getWidth(): number {
    return this.currentRect.width;
  }

  getHeight(): number {
    return this.currentRect.height;
  }

  objectSetXY(coords: ISUCoords): void {
    this.currentRect.x = coords.x;
    this.currentRect.y = coords.y;
    this.drawCurrentRect();
  }

  objectResize(lastXY: ISUCoords, offsetXY: ISUCoords, oldWH: ISUWidthHeight, resizeAs: ResizeCursorType | null): void {
    switch (resizeAs) {
      case 'e-resize': {
        let width = oldWH.width + offsetXY.x;
        if (width < 5) {
          width = 5;
        }
        this.currentRect = {
          ...this.currentRect,
          width,
        };
        break;
      }
      case 's-resize': {
        let height = oldWH.height + offsetXY.y;
        if (height < 5) {
          height = 5;
        }
        this.currentRect = {
          ...this.currentRect,
          height,
        };
        break;
      }
      case 'se-resize': {
        let width = oldWH.width + offsetXY.x;
        let height = oldWH.height + offsetXY.y;
        if (width < 5) {
          width = 5;
        }
        if (height < 5) {
          height = 5;
        }
        this.currentRect = {
          ...this.currentRect,
          width,
          height,
        };
        break;
      }
      case 'w-resize': {
        let x = lastXY.x + offsetXY.x;
        let width = oldWH.width - offsetXY.x;
        if (x < 0) {
          x = 0;
        }
        if (width < 5) {
          width = 5;
        }
        this.currentRect = {
          ...this.currentRect,
          x,
          width,
        };
        break;
      }
      case 'sw-resize': {
        let x = lastXY.x + offsetXY.x;
        let width = oldWH.width - offsetXY.x;
        let height = oldWH.height + offsetXY.y;

        if (x < 0) {
          x = 0;
        }
        if (width < 5) {
          width = 5;
        }
        if (height < 5) {
          height = 5;
        }
        this.currentRect = {
          ...this.currentRect,
          x,
          width,
          height,
        };
        break;
      }
      case 'n-resize': {
        let y = lastXY.y + offsetXY.y;
        let height = oldWH.height - offsetXY.y;
        if (y < 0) {
          y = 0;
        }
        if (height < 5) {
          height = 5;
        }
        this.currentRect = {
          ...this.currentRect,
          y,
          height,
        };
        break;
      }
      case 'nw-resize': {
        let x = lastXY.x + offsetXY.x;
        let width = oldWH.width - offsetXY.x;
        let y = lastXY.y + offsetXY.y;
        let height = oldWH.height - offsetXY.y;
        if (y < 0) {
          y = 0;
        }
        if (height < 5) {
          height = 5;
        }
        if (x < 0) {
          x = 0;
        }
        if (width < 5) {
          width = 5;
        }
        this.currentRect = {
          x,
          y,
          width,
          height,
        };
        break;
      }
      case 'ne-resize': {
        let y = lastXY.y + offsetXY.y;
        let height = oldWH.height - offsetXY.y;
        let width = oldWH.width + offsetXY.x;
        if (y < 0) {
          y = 0;
        }
        if (height < 5) {
          height = 5;
        }
        if (width < 5) {
          width = 5;
        }
        this.currentRect = {
          ...this.currentRect,
          y,
          height,
          width,
        };
        break;
      }
    }
    this.drawCurrentRect();
  }

  private drawCurrentRect(strokeColor: number | null = null): void {
    this.clear();
    this.rect(this.currentRect.x, this.currentRect.y, this.currentRect.width, this.currentRect.height).fill({
      color: this.bgColor,
      alpha: ALPHA_RECT_VALUE,
    });
    if (strokeColor) {
      this.stroke({ width: 1, color: strokeColor });
    }
  }

  private getCursor(e: FederatedPointerEvent): ResizeCursorType | null {
    if (!this.currentRect) {
      return null;
    }
    const local = this.toLocal({ x: e.globalX, y: e.globalY });
    const globalX = local.x;
    const globalY = local.y;
    const currentRect = {
      x: this.currentRect.x,
      y: this.currentRect.y,
      width: this.currentRect.width,
      height: this.currentRect.height,
    };
    if (globalX - currentRect.x < 5 && globalY - currentRect.y < 5) {
      return 'nw-resize';
    } else if (currentRect.x + currentRect.width - globalX < 5 && globalY - currentRect.y < 5) {
      return 'ne-resize';
    } else if (globalY - currentRect.y < 5) {
      return 'n-resize';
    } else if (currentRect.y + currentRect.height - globalY < 5 && globalX - currentRect.x < 5) {
      return 'sw-resize';
    } else if (currentRect.y + currentRect.height - globalY < 5 && currentRect.x + currentRect.width - globalX < 5) {
      return 'se-resize';
    } else if (currentRect.y + currentRect.height - globalY < 5) {
      return 's-resize';
    } else if (currentRect.x + currentRect.width - globalX < 5) {
      return 'e-resize';
    } else if (globalX - currentRect.x < 5) {
      return 'w-resize';
    } else {
      return 'move';
    }
  }
}
