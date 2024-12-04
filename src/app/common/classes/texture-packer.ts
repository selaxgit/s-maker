/**
 * Packing Lightmaps
 * desc https://gamedev.ru/pages/coriolis/articles/Packing_Lightmaps
 * see https://github.com/jakesgordon/bin-packing
 */

import { IWidthHeight } from '../interfaces';

export interface IPackerNode {
  w: number;
  h: number;
  x?: number;
  y?: number;
  id?: number;
  right?: IPackerNode;
  down?: IPackerNode;
  fit?: IPackerNode;
  used?: boolean;
}

export class TexturePacker {
  public root: IPackerNode;

  private blocks: IPackerNode[] = [];

  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {
    this.root = { x: 0, y: 0, w: width, h: height };
  }

  public fit(blocks: IPackerNode[]): void {
    let node: IPackerNode | null;
    this.blocks = blocks;
    for (let n = 0; n < blocks.length; n++) {
      const block = blocks[n];
      if ((node = this.findNode(this.root, block.w, block.h))) {
        block.fit = this.splitNode(node, block.w, block.h);
      }
    }
  }

  public getDimesion(): IWidthHeight {
    let width = 0;
    let height = 0;
    for (const node of this.blocks) {
      const x = Number(node.fit?.x);
      const y = Number(node.fit?.y);
      const w = node.w;
      const h = node.h;
      width = Math.max(width, x + w);
      height = Math.max(height, y + h);
    }
    return { width, height };
  }

  private findNode(root: IPackerNode, w: number, h: number): IPackerNode | null {
    if (root.used) {
      if (root.right) {
        const node = this.findNode(root.right, w, h);
        if (node) {
          return node;
        }
      }
      if (root.down) {
        const node = this.findNode(root.down, w, h);
        if (node) {
          return node;
        }
      }
      return null;
    }
    if (w <= root.w && h <= root.h) {
      return root;
    }
    return null;
  }

  private splitNode(node: IPackerNode, w: number, h: number): IPackerNode {
    node.used = true;
    node.down = { x: node.x, y: (node.y || 0) + h, w: node.w, h: node.h - h };
    node.right = { x: (node.x || 0) + w, y: node.y, w: node.w - w, h: h };
    return node;
  }
}
