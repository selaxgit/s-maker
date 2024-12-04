import { IProperties } from './common';

export interface IScene {
  id: number;
  projectId: number;
  name: string;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  actorX: number;
  actorY: number;
  actorLayerId: number | null;
}

export type SceneObjectType =
  | 'layer-sprites'
  | 'sprite'
  | 'layer-ground'
  | 'ground'
  | 'layer-grid'
  | 'layer-events'
  | 'event';

export interface ISceneObject {
  id: number;
  projectId: number;
  sceneId: number;
  parentId: number | null;
  type: SceneObjectType;
  name: string;
  referenceId: number | null;
  animationId: number | null;
  children: ISceneObject[];
  x: number;
  y: number;
  zIndex: number;
  visible: boolean;
  properties: IProperties | null;
  playing?: boolean;
  expanded?: boolean;
  width: number | null;
  height: number | null;
}
