import { IViewTile } from './common';

export interface IFrame {
  id: number;
  projectId: number;
  treeId: number | null;
  name: string;
  file: File;
  width: number;
  height: number;
}

export interface IFrameCached extends IFrame {
  objectURL: string;
  tooltip: string;
  used: boolean;
}

export interface IFlatTreeFrames {
  id: number;
  name: string;
  collapse: boolean;
  frames: IViewTile[];
}
