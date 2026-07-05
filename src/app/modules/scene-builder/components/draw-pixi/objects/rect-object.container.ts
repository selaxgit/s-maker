/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ISUCoords, ISURect, ISUWidthHeight } from '@selax/utils';
import { FederatedPointerEvent, Graphics } from 'pixi.js';

import { SceneLayerTypeEnum } from '~core/constants';
import { ISceneObjectEventsGround } from '~core/interfaces';
import { IDragStart } from '~pixijs/pixi.app';

import { BaseObjectContainer } from '../base-object.container';
import { ALPHA_RECT_VALUE, ResizeCursorType, SELECT_OBJECT_COLOR } from '../constants';

export class RectObjectContainer extends BaseObjectContainer {
  private currentRect: ISURect = { x: 0, y: 0, width: 0, height: 0 };

  private isSelected = false;

  private rectGraphics = new Graphics();

  constructor(
    override readonly typeLayer: SceneLayerTypeEnum,
    override readonly guidLayer: string,
    override readonly guidObject: string,
    protected readonly bgColor: number,
  ) {
    super(typeLayer, guidLayer, guidObject);
    this.addChild(this.rectGraphics);
    this.eventMode = 'static';
    this.cursor = 'default';
    this.on('pointermove', (e: FederatedPointerEvent) => {
      if (!this.captureObject) {
        this.objectCursor = this.getCursor(e);
      }
    });
  }

  override selectObject(selected: boolean): void {
    if (selected) {
      this.drawCurrentRect(SELECT_OBJECT_COLOR);
    } else if (this.isSelected) {
      this.drawCurrentRect();
    }
    this.isSelected = selected;
  }

  override async drawObject(objectInfo: ISceneObjectEventsGround): Promise<void> {
    const rect = { x: 0, y: 0, width: objectInfo.width ?? 25, height: objectInfo.height ?? 25 };
    if (JSON.stringify(rect) !== JSON.stringify(this.currentRect)) {
      this.currentRect = rect;
      this.drawCurrentRect(this.isSelected ? SELECT_OBJECT_COLOR : null);
    }
  }

  override getObjectAtCursor(e: FederatedPointerEvent): BaseObjectContainer | null {
    const point = e.getLocalPosition(this);
    const x = Math.floor(point.x);
    const y = Math.floor(point.y);
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this;
    }
    return null;
  }

  override dragObject(dx: number, dy: number, dragStart: IDragStart): void {
    if (this.objectCursor === 'move') {
      this.x = dx + dragStart.objectX;
      this.y = dy + dragStart.objectY;
    } else {
      this.objectResize(
        { x: dragStart.objectX, y: dragStart.objectY },
        { x: dx, y: dy },
        { width: dragStart.objectWidth, height: dragStart.objectHeight },
        this.objectCursor,
      );
    }
  }

  private objectResize(
    lastXY: ISUCoords,
    offsetXY: ISUCoords,
    oldWH: ISUWidthHeight,
    resizeAs: ResizeCursorType | null,
  ): void {
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
          width,
        };
        this.x = x;
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
          width,
          height,
        };
        this.x = x;
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
          height,
        };
        this.y = y;
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
          ...this.currentRect,
          width,
          height,
        };
        this.x = x;
        this.y = y;
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
          height,
          width,
        };
        this.y = y;
        break;
      }
    }
    this.drawCurrentRect();
  }

  private drawCurrentRect(strokeColor: number | null = null): void {
    this.rectGraphics.clear();
    this.rectGraphics.rect(0, 0, this.currentRect.width, this.currentRect.height).fill({
      color: this.bgColor,
      alpha: ALPHA_RECT_VALUE,
    });
    if (strokeColor) {
      this.rectGraphics.stroke({ width: 1, color: strokeColor });
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
