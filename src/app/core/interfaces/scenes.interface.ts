import { PropertiesType } from '~constants/common.constants';
import { SceneLayerTypeEnum } from '~core/constants';

export interface ISceneObject {
  guid: string;
  name: string;
  x: number;
  y: number;
  zIndex: number;
  visible: boolean;
  properties: PropertiesType | null;
}

export interface ISceneObjectSprite extends ISceneObject {
  referenceId: number | null;
  animationGuid: string | null;
  playing: boolean;
}

export interface ISceneObjectEventsGround extends ISceneObject {
  width: number;
  height: number;
}

export type SceneObjectType = ISceneObject | ISceneObjectSprite | ISceneObjectEventsGround;
export interface ISceneLayer {
  guid: string;
  type: SceneLayerTypeEnum;
  name: string;
  x: number;
  y: number;
  zIndex: number;
  visible: boolean;
  referenceGridId?: number;
  visibleGridLines?: boolean;
  properties: PropertiesType | null;
  objects: SceneObjectType[];
}

export interface IScene {
  id: number;
  projectId: number;
  name: string;
  width: number | null;
  height: number | null;
  offsetX: number | null;
  offsetY: number | null;
  layers: ISceneLayer[];
}
