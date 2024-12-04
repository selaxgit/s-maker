import { IFlatProperties } from './common';
import { ICoords, IRect, IWidthHeight } from './pixi';
import { SceneObjectType } from './scenes';
import { ISpriteAnimation } from './sprites';

export interface IFileInfo {
  id: number;
  width: number;
  height: number;
  file: File;
}
export const TEXTURE_PACKER_WIDTH = 6000;
export const TEXTURE_PACKER_HEIGHT = 6000;

export interface ISpriteDefinition {
  id: number;
  textureName?: string;
  name: string;
  width: number;
  height: number;
  groundPointX: number | null;
  groundPointY: number | null;
  animations: ISpriteAnimationsDefinition[];
  layers: ISpriteLayerDefinition[];
}

export interface ISpriteDefinitionForGame {
  id: number;
  name: string;
  width: number;
  height: number;
  groundPoint: ICoords | null;
  animations: ISpriteAnimationsDefinitionForGame[];
  layers: ISpriteLayerDefinitionForGame[];
}

interface ISpriteLayerDefinitionForGame {
  id: number;
  name: string;
  x: number;
  y: number;
  zIndex: number;
  frames: number[];
}

interface ISpriteAnimationsLayerDefinitionForGame {
  layerId: number;
  loop: boolean;
  speed: number;
}
type SpriteAnimationsDefinitionForGameOmitType = 'projectId' | 'order' | 'spriteId' | 'layers';
export interface ISpriteAnimationsDefinitionForGame
  extends Omit<ISpriteAnimation, SpriteAnimationsDefinitionForGameOmitType> {
  layers: ISpriteAnimationsLayerDefinitionForGame[];
}

type SpriteAnimationsDefinitionOmitType = 'projectId' | 'order' | 'spriteId';
export interface ISpriteAnimationsDefinition extends Omit<ISpriteAnimation, SpriteAnimationsDefinitionOmitType> {}

export interface ISpriteLayerDefinition {
  id: number;
  name: string;
  x: number;
  y: number;
  zIndex: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  frames: ISpriteFrameDefinition[];
}

export interface ISpriteFrameDefinition {
  fileId: number;
  x: number;
  y: number;
  height: number;
  width: number;
  zIndex: number;
}

interface IFrameDefinition {
  frameId: number;
  rect: IRect;
}

export interface IFramesDefinition {
  textureName: string;
  frames: IFrameDefinition[];
}

export interface IExportFrameDef {
  definition: IFrameDefinition[];
  canvas: HTMLCanvasElement;
}

export interface ISceneDefinition {
  name: string;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  actorX: number;
  actorY: number;
  actorLayerId: number | null;
  ground: ISceneGroundDefinition[];
  objects: ISceneObjectDefinition[];
  events: ISceneEventDefinition[];
}

export interface ISceneEventDefinition {
  rect: IRect;
  properties: IFlatProperties;
}

export interface ISceneGroundDefinition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ISceneObjectDefinition {
  id: number;
  name: string;
  type: SceneObjectType;
  x: number;
  y: number;
  zIndex: number;
  visible: boolean;
  externalId: number | null;
  animationId?: number | null;
  children?: ISceneObjectDefinition[];
}

export interface IGridDefinition {
  id: number;
  name: string;
  tileInfo: IWidthHeight;
  mapInfo: IWidthHeight;
  items: IGridItemDefinition[];
}

export interface IGridItemDefinition {
  x: number;
  y: number;
  referenceId: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  stretch: boolean;
  properties: IFlatProperties;
  zIndex: number;
}
