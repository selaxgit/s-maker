/* eslint-disable @typescript-eslint/no-magic-numbers */
import { FlatTreeControl } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';
import { JSTDialogService } from '@jst/ui';
import { take } from 'rxjs';

import { ISelectedNode, TreeStore } from '../../../stores';
import { HtmlHelper } from '../../helpers';
import { ITreeItem } from '../../interfaces';
import { TreeService } from '../../services/tree';
import { SMCInputTextModalComponent } from '../input-text-modal/input-text-modal.component';
import { IFlatTreeNode } from './interfaces';

export interface IDropToNodeEvent {
  id: number;
  treeId: number | null;
}

@Component({
    selector: 'smc-tree',
    imports: [CommonModule, MatButtonModule, MatTreeModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './tree.component.html',
    styleUrl: './tree.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SMCTreeComponent implements OnInit {
  @Input() set projectId(val: number) {
    this.projectIdValue = val;
    this.treeStore.fetchTreeList({ projectId: val, treeService: this.treeService, storageKey: this.treeStorageKey });
  }

  @Input() treeStorageKey = 'tree-selected';

  @Input() canEditTree = true;

  @Input() askRemoveTree = 'Вы действительно хотите удалить эту ветку?';

  @Output() dropToNodeEvent = new EventEmitter<IDropToNodeEvent>();

  readonly isLoading$ = this.treeStore.isLoading$;

  readonly selectedNode = this.treeStore.selectedNode$;

  readonly treeControl = new FlatTreeControl<IFlatTreeNode>(
    (node: IFlatTreeNode) => node.level,
    (node: IFlatTreeNode) => node.expandable,
  );

  readonly treeFlattener = new MatTreeFlattener<ITreeItem, IFlatTreeNode, IFlatTreeNode>(
    this.transformer,
    (node: IFlatTreeNode) => node.level,
    (node: IFlatTreeNode) => node.expandable,
    (node: ITreeItem) => node.children,
  );

  readonly dataSource = new MatTreeFlatDataSource<ITreeItem, IFlatTreeNode, IFlatTreeNode>(
    this.treeControl,
    this.treeFlattener,
  );

  readonly hasChild = (_: number, node: IFlatTreeNode): boolean => node.expandable;

  private dragOverNodeId: number | null = null;

  private dragNodeExpandArea = 0;

  private projectIdValue!: number;

  private destroyRef$ = inject(DestroyRef);

  constructor(
    private readonly jstDialogService: JSTDialogService,
    private readonly treeStore: TreeStore,
    private readonly treeService: TreeService,
  ) {}

  ngOnInit(): void {
    this.treeStore.tree$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((tree: ITreeItem[]) => {
      this.dataSource.data = tree;
      this.treeStore.selectedNode$.pipe(take(1)).subscribe((node: ISelectedNode | null) => {
        if (node && node.parentId) {
          this.expandNode(node.id);
        }
      });
    });
  }

  onNodeClick(node: IFlatTreeNode): void {
    this.treeStore.selectNode({
      projectId: this.projectIdValue,
      storageKey: this.treeStorageKey,
      node: {
        id: node.id,
        parentId: node.parentId,
        name: node.name,
      },
    });
  }

  onAddNode(e: MouseEvent, parentId: number | null = null): void {
    e.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.jstDialogService
      .showModal<string>('Добавление ветки', SMCInputTextModalComponent, {
        label: 'Наименование ветки',
        applyTitle: 'Добавить ветку',
      })
      .subscribe((value: string) => {
        if (value !== undefined) {
          this.treeStore.addTreeNode({
            projectId: this.projectIdValue,
            treeService: this.treeService,
            name: value,
            parentId: parentId,
          });
        }
      });
  }

  onEditNode(e: MouseEvent, node: IFlatTreeNode): void {
    e.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.jstDialogService
      .showModal<string>('Редактирование ветки', SMCInputTextModalComponent, {
        label: 'Наименование ветки',
        applyTitle: 'Обновить ветку',
        value: node.name,
      })
      .subscribe((value: string) => {
        if (value !== undefined) {
          this.treeStore.updateTreeNode({
            projectId: this.projectIdValue,
            treeService: this.treeService,
            id: node.id,
            parentId: node.parentId,
            name: value,
          });
        }
      });
  }

  onRemoveNode(e: MouseEvent, node: IFlatTreeNode): void {
    e.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.jstDialogService
      .showConfirm(this.askRemoveTree, 'Удаление ветки', 'Удалить ветку')
      .subscribe((confirm: boolean) => {
        if (confirm) {
          this.treeStore.removeTreeNode({
            projectId: this.projectIdValue,
            treeService: this.treeService,
            id: node.id,
            done: () => {
              if (node.parentId) {
                this.expandNode(node.parentId);
              }
              this.treeStore.selectNode({
                projectId: this.projectIdValue,
                storageKey: this.treeStorageKey,
                node: null,
              });
            },
          });
        }
      });
  }

  onRootNode(): void {
    HtmlHelper.blurActiveElement();
    this.treeStore.selectNode({
      projectId: this.projectIdValue,
      storageKey: this.treeStorageKey,
      node: null,
    });
  }

  onDragStart(e: DragEvent, node: IFlatTreeNode): void {
    if (node.expandable) {
      this.collapseNode(node.id);
    }
    e.dataTransfer?.setData('drag-node', String(node.id));
    e.dataTransfer?.setData('smdn-' + String(node.id), '');
  }

  onDragEnd(e: DragEvent): void {
    this.dragOverNodeId = null;
    e.preventDefault();
  }

  onDragOver(e: DragEvent, node: IFlatTreeNode): void {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
      if (node.expandable) {
        this.expandNode(node.id);
      }
      const hasDragTile = e.dataTransfer.types.includes('drag-tile');
      if (hasDragTile) {
        this.dragOverNodeId = node.id;
        this.dragNodeExpandArea = 0;
        return;
      }

      let dragNode = e.dataTransfer.getData('drag-node');
      // Chrome не позволяет получить данные при DragOver - хакаем через типы ((
      if (!dragNode) {
        const type = e.dataTransfer.types.find((i: string) => i.indexOf('smdn-') >= 0);
        if (type) {
          dragNode = type.slice(5);
        }
        if (isNaN(parseInt(dragNode, 10))) {
          dragNode = '';
        }
      }
      if (dragNode) {
        const dragNodeId = Number(dragNode);
        if (dragNodeId === node.id) {
          return;
        }
        this.dragOverNodeId = node.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (e.target && (e.target as any).clientHeight > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const percentageY = e.offsetY / (e.target as any).clientHeight;
          if (0 <= percentageY && percentageY <= 0.25) {
            this.dragNodeExpandArea = 1;
          } else if (1 >= percentageY && percentageY >= 0.75) {
            this.dragNodeExpandArea = -1;
          } else {
            this.dragNodeExpandArea = 0;
          }
        }
      }
    }
  }

  onDragLeave(): void {
    this.dragOverNodeId = null;
  }

  onDrop(e: DragEvent, node: IFlatTreeNode): void {
    e.preventDefault();
    if (e.dataTransfer) {
      this.dragOverNodeId = null;
      const dragTile = e.dataTransfer.getData('drag-tile');
      if (dragTile) {
        this.dropToNodeEvent.emit({ id: Number(dragTile), treeId: node.id });
        return;
      }

      const dragNode = e.dataTransfer.getData('drag-node');
      if (dragNode) {
        const dragNodeId = Number(dragNode);
        if (dragNodeId === node.id) {
          return;
        }
        const dragData = this.findNodeData(dragNodeId);
        if (!dragData) {
          return;
        }
        const nodeData = this.findNodeData(node.id);
        if (!nodeData) {
          return;
        }
        const dragParent = this.findParentNodeData(dragNodeId);
        if (dragParent) {
          const idx = dragParent.children.findIndex((i: ITreeItem) => i.id === dragNodeId);
          dragParent.children.splice(idx, 1);
        } else {
          const idx = this.dataSource.data.findIndex((i: ITreeItem) => i.id === dragNodeId);
          this.dataSource.data.splice(idx, 1);
        }
        const nodeParent = this.findParentNodeData(node.id);
        let children: ITreeItem[] = [];
        if (nodeParent) {
          dragData.parentId = nodeParent.id;
          children = nodeParent.children;
        } else {
          dragData.parentId = null;
          children = this.dataSource.data;
        }
        const idxNode = children.findIndex((i: ITreeItem) => i.id === node.id);
        switch (this.dragNodeExpandArea) {
          case 1:
            children.splice(idxNode, 0, dragData);
            break;
          case -1:
            children.splice(idxNode + 1, 0, dragData);
            break;
          default:
            dragData.parentId = nodeData.id;
            nodeData.children.splice(0, 0, dragData);
            children = nodeData.children;
        }
        const idxExpanded: number[] = [];
        this.treeControl.dataNodes.forEach((i: IFlatTreeNode) => {
          if (this.treeControl.isExpanded(i)) {
            idxExpanded.push(i.id);
          }
        });
        this.dataSource.data = [...this.dataSource.data];
        this.treeControl.dataNodes.forEach((i: IFlatTreeNode) => {
          if (idxExpanded.includes(i.id)) {
            this.treeControl.expand(i);
          }
        });

        this.treeStore.selectNode({
          projectId: this.projectIdValue,
          storageKey: this.treeStorageKey,
          node: {
            id: dragData.id,
            parentId: dragData.parentId,
            name: dragData.name,
          },
        });

        this.treeStore.reOrderNodeEvent({
          projectId: this.projectIdValue,
          treeService: this.treeService,
          children,
        });
      }
    }
  }

  getNodeStyle(node: IFlatTreeNode): string {
    if (node.id === this.dragOverNodeId) {
      switch (this.dragNodeExpandArea) {
        case 1:
          return 'drop-above';
        case -1:
          return 'drop-below';
        default:
          return 'drop-center';
      }
    }
    return '';
  }

  private transformer(node: ITreeItem, level: number): IFlatTreeNode {
    return {
      expandable: !!node.children && node.children.length > 0,
      id: node.id,
      parentId: node.parentId,
      name: node.name,
      title: node.name,
      selectedChars: false,
      level,
    } as IFlatTreeNode;
  }

  private collapseNode(id: number | null): boolean {
    const node = (this.treeControl.dataNodes || []).find((i: IFlatTreeNode) => i.id == id);
    if (node) {
      if (node.expandable) {
        this.treeControl.collapse(node);
        return true;
      }
    }
    return false;
  }

  private expandNode(id: number | null): boolean {
    const node = (this.treeControl.dataNodes || []).find((i: IFlatTreeNode) => i.id == id);
    if (node) {
      if (node.expandable) {
        this.treeControl.expand(node);
      }
      if (node.parentId) {
        return this.expandNode(node.parentId);
      }
    }
    return false;
  }

  private findNodeData(id: number): ITreeItem | null {
    const findNode = (list: ITreeItem[]): ITreeItem | null => {
      for (const item of list) {
        if (item.id === id) {
          return item;
        }
        if (Array.isArray(item.children)) {
          const child = findNode(item.children);
          if (child) {
            return child;
          }
        }
      }
      return null;
    };
    return findNode(this.dataSource.data);
  }

  private findParentNodeData(id: number): ITreeItem | null {
    const findInChild = (list: ITreeItem[]): ITreeItem | null => {
      for (const item of list) {
        const child = item.children.find((i: ITreeItem) => i.id === id);
        if (child) {
          return item;
        }
        const inChild = findInChild(item.children);
        if (inChild) {
          return inChild;
        }
      }
      return null;
    };
    for (const item of this.dataSource.data) {
      const child = item.children.find((i: ITreeItem) => i.id === id);
      if (child) {
        return item;
      }
      const inChild = findInChild(item.children);
      if (inChild) {
        return inChild;
      }
    }
    return null;
  }
}
