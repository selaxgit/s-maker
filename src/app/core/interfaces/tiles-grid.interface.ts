import { ISUWidthHeight } from '@selax/utils';

import { PropertiesType } from '~constants/common.constants';

export interface ITilesGridBackground {
  opacity: number;
  file: File | null;
}

export interface ITilesGridItem {
  x: number;
  y: number;
  frameId: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  stretch: boolean;
  properties: PropertiesType;
  zIndex: number;
}

export interface ITilesGrid {
  id: number;
  projectId: number;
  name: string;
  tileInfo: ISUWidthHeight;
  mapInfo: ISUWidthHeight;
  background: ITilesGridBackground;
  items: ITilesGridItem[];
}

export interface ITilesGridParams {
  mapWidth: number;
  mapHeight: number;
  tileWidth: number;
  tileHeight: number;
  bgOpacity: number;
  bgFile: File | null;
}
