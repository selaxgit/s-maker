export interface IViewTile {
  id: number;
  treeId: number | null;
  name: string;
  tooltip: string;
  objectURL: string;
  used: boolean;
  selected: boolean;
  data?: unknown;
  fileWidth: number;
  fileHeight: number;
}

export interface ISMVersion {
  smVersion: string;
}
