/* eslint-disable @typescript-eslint/no-magic-numbers */
import { FederatedPointerEvent, Graphics } from 'pixi.js';
import { Subject } from 'rxjs';

import { EditorToolStateType, ICoords, IRect, ISceneObject, IWidthHeight } from '../../../../../common/interfaces';
import { ALPHA_RECT_VALUE, CanActionType, ResizeAsCursorType, SELECT_OBJECT_COLOR } from './constants';

export class RectGraphics extends Graphics {
  public mouseEnterEvent = new Subject<RectGraphics>();

  public mouseLeaveEvent = new Subject<RectGraphics>();

  private currentRect: IRect = { x: 0, y: 0, width: 25, height: 25 };

  private toolStateValue: EditorToolStateType = 'move';

  private moveState: ResizeAsCursorType = 'move';

  private isDragState = false;

  constructor(
    public readonly objectId: number,
    public readonly bgColor: number,
  ) {
    super();
    this.eventMode = 'static';
    this.cursor = 'default';
    this.on('pointermove', (e: FederatedPointerEvent) => {
      if (this.toolStateValue === 'drag-object') {
        if (!this.isDragState) {
          this.moveState = this.getMoveState(e);
          this.cursor = this.moveState;
        }
      }
    })
      .on('pointerenter', () => {
        if (['info', 'drag-object'].includes(this.toolStateValue)) {
          this.drawCurrentRect(SELECT_OBJECT_COLOR);
        }
        this.mouseEnterEvent.next(this);
      })
      .on('pointerleave', () => {
        if (['info', 'drag-object'].includes(this.toolStateValue)) {
          this.drawCurrentRect();
        }
        this.mouseLeaveEvent.next(this);
      });
  }

  public set toolState(value: EditorToolStateType) {
    this.toolStateValue = value;
    if (this.toolStateValue !== 'drag-object') {
      this.cursor = 'default';
    }
  }

  public onResize(
    lastXY: ICoords,
    offsetXY: ICoords,
    oldWH: IWidthHeight,
    resizeAsCursor: ResizeAsCursorType | null,
  ): void {
    switch (resizeAsCursor) {
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
    }
    this.drawCurrentRect();
  }

  public onDragState(value: boolean): void {
    this.isDragState = value;
  }

  public onGetCursor(): ResizeAsCursorType {
    return this.moveState;
  }

  public onCanAction(): CanActionType {
    if (this.moveState === 'move') {
      return 'drag';
    }
    return 'resize';
  }

  public onGetXYWH(): IRect {
    return this.currentRect;
  }

  public getX(): number {
    return this.currentRect.x;
  }

  public getY(): number {
    return this.currentRect.y;
  }

  public onUpdateXY(offsetCoords: ICoords): void {
    this.currentRect.x = offsetCoords.x;
    this.currentRect.y = offsetCoords.y;
    this.drawCurrentRect();
  }

  public updateObject(object: ISceneObject): void {
    this.currentRect = { x: object.x, y: object.y, width: object.width ?? 25, height: object.height ?? 25 };
    this.drawCurrentRect();
    this.visible = object.visible;
  }

  private drawCurrentRect(strokeColor: number | null = null): void {
    this.clear().rect(this.currentRect.x, this.currentRect.y, this.currentRect.width, this.currentRect.height).fill({
      color: this.bgColor,
      alpha: ALPHA_RECT_VALUE,
    });
    if (strokeColor) {
      this.stroke({ width: 1, color: strokeColor });
    }
  }

  private getMoveState(e: FederatedPointerEvent): ResizeAsCursorType {
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
