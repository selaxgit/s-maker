import { ISUCoords, ISURect } from '@selax/utils';

export interface ISpriteAnimation {
  guid: string;
  code: string;
  name: string;
  default: boolean;
  groundPoint: ISUCoords | null;
  visibleGroundPoint: boolean;
  collisionFrame: ISURect | null;
  visibleCollisionFrame: boolean;
  layers: ISpriteAnimationLayer[];
}

export interface ISpriteAnimationLayer {
  layerGuid: string;
  loop: boolean;
  speed: number | null;
  frames: Record<string, number | null>;
}

export interface ILayerAnimationRow extends ISpriteAnimationLayer {
  layerName: string;
}

export interface ISelectLayer {
  layerGuid: string;
  frameGuid: string | null;
}

export interface ISpriteFrame {
  guid: string;
  frameId: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  visible: boolean;
}

export interface ISpriteLayer {
  guid: string;
  name: string;
  visible: boolean;
  x: number;
  y: number;
  zIndex: number;
  bgColor: string | null;
  flipHorizontal: boolean;
  flipVertical: boolean;
  frames: ISpriteFrame[];
}

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
  layers: ISpriteLayer[];
  animations: ISpriteAnimation[];
}

export type DefinitionSpriteType = Omit<ISprite, 'id' | 'projectId' | 'treeId'>;

export interface IDefinitionSpriteLayerForGame extends Omit<ISpriteLayer, 'name' | 'visible' | 'bgColor' | 'frames'> {
  frames: number[];
}

export type DefinitionSpriteAnimationForGameType = Omit<
  ISpriteAnimation,
  'name' | 'visibleGroundPoint' | 'visibleCollisionFrame'
>;

export interface IDefinitionSpriteForGame extends Omit<
  DefinitionSpriteType,
  'bgColor' | 'groundPointX' | 'groundPointY' | 'visibleGroundPoint' | 'layers' | 'animations'
> {
  groundPoint: ISUCoords | null;
  layers: IDefinitionSpriteLayerForGame[];
  animations: DefinitionSpriteAnimationForGameType[];
}
