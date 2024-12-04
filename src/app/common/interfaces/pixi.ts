export type ZoomType = 'in' | 'out' | 'default';

export interface ICoords {
  x: number;
  y: number;
}

export interface IWidthHeight {
  width: number;
  height: number;
}

export interface IRect extends ICoords, IWidthHeight {}
