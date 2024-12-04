import { IDBTreeItem, IFlatProperties, IProperties, ITreeItem } from '../interfaces';

export class TransformHelper {
  public static propertiesToFlat(properties: IProperties): IFlatProperties {
    const ret: IFlatProperties = {};
    Object.keys(properties).forEach((key: string) => {
      switch (properties[key].type) {
        case 'boolean':
          ret[key] = Boolean(properties[key].value);
          break;
        case 'number':
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let value = parseFloat(properties[key].value as any);
          if (isNaN(value)) {
            value = 0;
          }
          ret[key] = value;
          break;
        default:
          ret[key] = String(properties[key].value);
      }
    });
    return ret;
  }

  public static flatToTree(flatValues: IDBTreeItem[]): ITreeItem[] {
    const filterChildren = (id: number | null): ITreeItem[] => {
      const values = flatValues
        .filter((item: IDBTreeItem) => item.parentId === id)
        .map((item: IDBTreeItem) => ({ ...item, children: [] }));
      return values.sort((a: ITreeItem, b: ITreeItem) => (a.order ?? Infinity) - (b.order ?? Infinity));
    };

    const addChildren = (tree: ITreeItem[]): void => {
      for (const item of tree) {
        item.children = filterChildren(item.id);
        addChildren(item.children);
      }
    };

    const tree: ITreeItem[] = filterChildren(null);
    addChildren(tree);
    return tree;
  }

  public static treeToFlat(treeValues: ITreeItem[], calcOrder: boolean = false): IDBTreeItem[] {
    const tree: IDBTreeItem[] = [];
    const walkTree = (values: ITreeItem[]): void => {
      let order = 0;
      for (const item of values) {
        tree.push({
          id: item.id,
          projectId: item.projectId,
          parentId: item.parentId,
          name: item.name,
          order: calcOrder ? order : item.order,
        });
        order++;
        walkTree(item.children);
      }
    };
    walkTree(treeValues);
    return tree;
  }
}
