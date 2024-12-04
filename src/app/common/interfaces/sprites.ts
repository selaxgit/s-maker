import { ICoords, IRect } from './pixi';

export type SpriteEditStateType = 'adjustment' | 'animations';

export interface ISprite {
  id: number;
  projectId: number;
  treeId: number | null;
  name: string;
  width: number;
  height: number;
  bgColor: string | null;
  groundPointX: number | null;
  groundPointY: number | null;
  visibleGroundPoint: boolean;
}

export interface ISpriteCached extends ISprite {
  objectURL: string;
  tooltip: string;
}

export interface ISpriteLayer {
  id: number;
  projectId: number;
  spriteId: number;
  name: string;
  visible: boolean;
  x: number;
  y: number;
  zIndex: number;
  bgColor: string | null;
  flipHorizontal: boolean;
  flipVertical: boolean;
  order?: number;
}

export interface ISpriteLayersListItem extends ISpriteLayer {
  frames: ISpriteFrame[];
}

export interface ISpriteFrame {
  id: number;
  projectId: number;
  spriteId: number;
  layerId: number;
  frameId: number;
  file: File;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  zIndex: number;
  order?: number;
}

export interface ISpriteAnimation {
  id: number;
  projectId: number;
  order?: number;
  spriteId: number;
  name: string;
  default: boolean;
  groundPoint: ICoords | null;
  collisionFrame: IRect | null;
  layers: ISpriteAnimationLayer[];
}

export interface ISpriteAnimationLayer {
  layerId: number | null;
  loop: boolean;
  speed: number;
  frames: ISpriteAnimationLayerFrame[];
}

export interface ISpriteAnimationLayerFrame {
  id: number;
  name: string;
  speed: number | null;
}

export interface IAnimationPlayingInfo {
  id: number;
  playing: boolean;
}

export interface ISpriteInfo {
  spriteInfo: ISprite;
  spriteLayers: ISpriteLayersListItem[];
  spriteAnimation: ISpriteAnimation[];
}
