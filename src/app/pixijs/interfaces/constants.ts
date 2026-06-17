export const VIEWPORT_MIN_SCALE = 0.1;
export const VIEWPORT_MAX_SCALE = 20;

export enum AppPixiStateEnum {
  None = 'none',
  Move = 'move',
  Info = 'info',
  DragObject = 'drag-object',
  DrawRect = 'draw-rect',
  DrawObject = 'draw-object',
  RemoveObject = 'remove-object',
}

export enum ZoomEnum {
  In = 'in',
  Out = 'out',
  Default = 'default',
}
