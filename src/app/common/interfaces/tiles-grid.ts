import { IProperties } from './common';
import { IWidthHeight } from './pixi';

export interface ITilesGridBg {
  id: number;
  projectId: number;
  gridId: number;
  opacity: number;
  file: File;
}

export interface ITilesGrid {
  id: number;
  projectId: number;
  name: string;
  tileInfo: IWidthHeight;
  mapInfo: IWidthHeight;
  items: ITilesGridItem[];
}

export interface ITilesGridItem {
  x: number;
  y: number;
  referenceId: number | null;
  flipHorizontal: boolean;
  flipVertical: boolean;
  stretch: boolean;
  properties: IProperties;
  zIndex: number;
}
