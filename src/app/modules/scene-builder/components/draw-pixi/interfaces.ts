import { ISUCoords, ISURect, ISUWidthHeight } from '@selax/utils';
import { ContainerChild } from 'pixi.js';

import { SceneLayerTypeEnum } from '~core/constants';

import { SBDrawSceneService } from '../../services';
import { ResizeCursorType } from './constants';

export interface IPixiSceneLayer extends ContainerChild {
  typeLayer: SceneLayerTypeEnum | null;
  guidLayer: string | null;
  drawObjects(objectsInfo: unknown): Promise<void>;
  onObjectMouseMove?: ((info: ISceneLayerMouseEvent) => void) | null;
  onObjectMouseLeave?: (() => void) | null;
  onSpritePlayChanged?: ((guidLayer: string, guidObject: string, playing: boolean) => void) | null;
  selectedObject?: (guidObject: string | null) => void;
}

export type PixiSceneLayerConstructorType = new (params: SBDrawSceneService | number) => IPixiSceneLayer;

export interface ILayerGrid {
  referenceGridId: number;
}

export interface ISceneLayerMouseEvent {
  typeLayer: SceneLayerTypeEnum;
  guidLayer: string;
  guidObject: string;
  object: ISceneDragObject;
  data: unknown;
}

export interface IObjectRectGraphicsData {
  cursor: ResizeCursorType | null;
  mode: 'resize' | 'drag';
}

export interface ISceneDragObject extends ContainerChild {
  guidObject: string;
  getX: () => number;
  getY: () => number;
  getWidth: () => number;
  getHeight: () => number;
  objectSetXY?: (coords: ISUCoords) => void;
  objectResize?: (
    lastXY: ISUCoords,
    offsetXY: ISUCoords,
    oldWH: ISUWidthHeight,
    resizeAs: ResizeCursorType | null,
  ) => void;
}

export interface ISceneObjectChange {
  typeLayer: SceneLayerTypeEnum;
  guidLayer: string;
  guidObject: string;
  rect: ISURect;
}

export interface ISceneObjectSelected {
  guidLayer: string;
  guidObject: string;
}
