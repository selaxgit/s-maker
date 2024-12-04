export interface IFlatTreeNode {
  id: number;
  parentId: number | null;
  name: string;
  title: string;
  selectedChars: boolean;
  expandable: boolean;
  level: number;
  children: IFlatTreeNode[];
}

export interface ITreeSelectedEvent {
  id: number;
  parentId: number | null;
  name: string;
}
