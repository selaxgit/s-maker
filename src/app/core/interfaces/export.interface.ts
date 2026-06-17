import { ISUCoords, ISURect } from '@selax/utils';

import { FlatPropertiesType } from '~core/constants/export.constants';

import { IFrameDefinition } from './frames.interface';
import { ISceneLayer, ISceneObject } from './scenes.interface';
import { ISprite, ISpriteAnimation, ISpriteAnimationLayer } from './sprites.interface';
import { ITilesGrid, ITilesGridItem } from './tiles-grid.interface';

export interface IExportScene {
  name: string;
  params: IExportSceneParams;
  layers: IExportSceneLayer[];
  events: IExportSceneEventsGround[];
  grounds: IExportSceneEventsGround[];
}

export interface IExportSceneEventsGround {
  rect: ISURect;
  properties: FlatPropertiesType | null;
}

export interface IExportSceneParams {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export interface IExportSceneLayer extends Omit<ISceneLayer, 'properties' | 'name' | 'objects'> {
  objects: IExportSceneObjectType[];
  properties: FlatPropertiesType;
}

export interface IExportSceneObject extends Omit<ISceneObject, 'properties'> {
  properties: FlatPropertiesType | null;
}

export interface IExportSceneObjectSprite extends IExportSceneObject {
  referenceId: number | null;
  animationGuid: string | null;
  playing: boolean;
}

export interface IExportSceneObjectEventsGround extends IExportSceneObject {
  width: number;
  height: number;
}

export type IExportSceneObjectType = IExportSceneObject | IExportSceneObjectSprite | IExportSceneObjectEventsGround;

export interface IExportFrameDef {
  definition: IFrameDefinition[];
  canvas: HTMLCanvasElement;
}

export interface IExportTilesGridItem extends Omit<ITilesGridItem, 'properties'> {
  properties: FlatPropertiesType | null;
}

export interface IExportTilesGrid extends Omit<ITilesGrid, 'id' | 'projectId' | 'name' | 'background' | 'items'> {
  items: IExportTilesGridItem[];
}

export interface IExportSprite extends Omit<
  ISprite,
  | 'id'
  | 'projectId'
  | 'treeId'
  | 'name'
  | 'bgColor'
  | 'groundPointX'
  | 'groundPointY'
  | 'visibleGroundPoint'
  | 'layers'
  | 'animations'
> {
  id?: number;
  groundPoint: ISUCoords | null;
  layers: IExportSpriteLayer[];
  animations: IExportSpriteAnimation[];
}

export interface IExportSpriteLayer {
  guid: string;
  zIndex: number;
  frames: number[];
}

export interface IExportSpriteAnimation extends Omit<
  ISpriteAnimation,
  'guid' | 'visibleGroundPoint' | 'visibleCollisionFrame' | 'layers'
> {
  layers: IExportSpriteAnimationLayer[];
}

export interface IExportSpriteAnimationLayer extends Omit<ISpriteAnimationLayer, 'layerName' | 'frames'> {
  frames?: Record<string, number | null>;
}
