import { ISURect } from '@selax/utils';

export interface IFrame {
  id: number;
  projectId: number;
  treeId: number | null;
  name: string;
  file: File;
  width: number;
  height: number;
}

export interface IFrameDefinition {
  frameId: number;
  rect: ISURect;
}

export interface IFrameDefinitionList {
  definition: IFrameDefinition[];
  canvas: HTMLCanvasElement;
}

export interface IExportFrameDefinition {
  definition: IFrameDefinition[];
  textureName: string;
  textureFile: File;
}

export interface IFramesDefinition {
  frames: IFrameDefinition[];
  textureName: string;
}
