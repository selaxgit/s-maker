import { ICoords, IRect, IWidthHeight, SceneObjectType } from '../../../../../common/interfaces';

export const LAYER_GROUND_COLOR = 0xa2653e;
export const LAYER_EVENTS_COLOR = 0xa60000;
export const SELECT_OBJECT_COLOR = 0xff3100;
export const SELECT_TINT_COLOR = 0xff3100;
export const ALPHA_RECT_VALUE = 0.7;

export type CanActionType = 'drag' | 'resize';
export type ResizeAsCursorType =
  | 'nw-resize'
  | 'ne-resize'
  | 'n-resize'
  | 'sw-resize'
  | 'se-resize'
  | 's-resize'
  | 'e-resize'
  | 'w-resize'
  | 'move';

export interface ICurrentObject {
  objectId: number;
  type: SceneObjectType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onUpdateXY?: (coords: ICoords) => void;
  onResize?: (
    lastXY: ICoords,
    offsetXY: ICoords,
    oldWH: IWidthHeight,
    resizeAsCursor: ResizeAsCursorType | null,
  ) => void;
  onGetXYWH?: () => IRect | null;
  onCanAction?: () => CanActionType;
  onGetCursor?: () => ResizeAsCursorType;
  onDragState?: (isDrag: boolean) => void;
}
