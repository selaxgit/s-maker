export type EditorToolStateType = 'move' | 'info' | 'remove' | 'draw' | 'drag-object';

export interface IDBTreeItem {
  id: number;
  projectId: number;
  parentId: number | null;
  name: string;
  order: number;
}

export interface ITreeItem extends IDBTreeItem {
  children: ITreeItem[];
}

export interface IViewTile {
  id: number;
  treeId: number | null;
  name: string;
  tooltip: string;
  objectURL: string;
  file: File | null;
  width: number;
  height: number;
  used?: boolean;
  selected?: boolean;
  canvas?: HTMLCanvasElement;
}

export type PropertyType = 'number' | 'string' | 'boolean';
export type PropertyValueType = number | string | boolean;
export interface IProperties {
  [key: string]: {
    type: PropertyType;
    value: PropertyValueType;
  };
}

export interface IFlatProperties {
  [key: string]: PropertyValueType;
}

export type ReplaceTilePropertiesType = 'add' | 'replace';

export interface IStoreKeyCanvas {
  [key: number]: HTMLCanvasElement;
}
