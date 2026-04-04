import { SUJsonHelper } from '@selax/utils';

import { IDBTreeItem, ITreeItem } from '~interfaces/tree.interface';

export class TreeHelper {
  static removeNode(id: number, list: ITreeItem[]): ITreeItem[] {
    for (const [idx, item] of list.entries()) {
      if (item.id === id) {
        list.splice(idx, 1);
        return list;
      }
      TreeHelper.removeNode(id, item.children);
    }
    return list;
  }

  static flatToTree(list: IDBTreeItem[]): ITreeItem[] {
    const tree: ITreeItem[] = SUJsonHelper.clone(list);
    const map: Record<number, number> = {};
    const roots: ITreeItem[] = [];
    tree.forEach((v: ITreeItem, i: number) => {
      map[v.id] = i;
      tree[i].children = [];
    });
    tree.forEach((v: ITreeItem) => (v.parentId !== null ? tree[map[v.parentId]].children.push(v) : roots.push(v)));
    return roots;
  }

  static reOrderItems(list: ITreeItem[]): void {
    let order = 0;
    for (const item of list) {
      item.order = order;
      order++;
      TreeHelper.reOrderItems(item.children);
    }
  }

  static orderItems(list: ITreeItem[]): void {
    list.sort((a: ITreeItem, b: ITreeItem) => a.order - b.order);
    for (const item of list) {
      TreeHelper.orderItems(item.children);
    }
  }

  static getIndexById(id: number, list: ITreeItem[]): number | null {
    for (const [idx, item] of list.entries()) {
      if (item.id === id) {
        return idx;
      }
      const childIdx = TreeHelper.getIndexById(id, item.children);
      if (childIdx !== null) {
        return childIdx;
      }
    }
    return null;
  }

  static collectIdsNodes(list: ITreeItem[]): number[] {
    const ret: number[] = [];
    for (const item of list) {
      const ids = TreeHelper.collectIdsNodes(item.children);
      ret.push(item.id, ...ids);
    }
    return ret;
  }

  static findNode(id: number, list: ITreeItem[], removeFoundNode: boolean = false): ITreeItem | null {
    for (const [idx, item] of list.entries()) {
      if (item.id === id) {
        if (removeFoundNode) {
          list.splice(idx, 1);
        }
        return item;
      }
      const child = TreeHelper.findNode(id, item.children, removeFoundNode);
      if (child) {
        return child;
      }
    }
    return null;
  }

  static treeToFlat(items: ITreeItem[]): IDBTreeItem[] {
    if (!items || !items.length) {
      return [];
    }
    return items.reduce((totalItems: IDBTreeItem[], item: ITreeItem) => {
      const children = item.children;
      (item as Partial<ITreeItem>).children = undefined;
      totalItems.push(item);
      return totalItems.concat(TreeHelper.treeToFlat(children));
    }, []);
  }
}
