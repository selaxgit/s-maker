import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, input, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTree, MatTreeModule } from '@angular/material/tree';
import { SDialogService } from '@selax/ui';

import { SMCInputTextModal } from '~components/input-text-modal';
import { SMCDragTypeEnum, SMCDropPositionEnum } from '~constants/drag.constants';
import { IViewTile } from '~core/interfaces';
import { SMCDragDirective } from '~directives/drag.directive';
import { SMCDropTreeNodeDirective } from '~directives/drop-tree-node.directive';
import { TreeHelper } from '~helpers/tree.helper';
import { IDropInfo } from '~interfaces/drag.interface';
import { ITreeItem, ITreeStore } from '~interfaces/tree.interface';
import { TREE_FRAMES_SERVICE_TOKEN, TREE_FRAMES_STORE_TOKEN } from '~tokens/tree.tokens';

@Component({
  selector: 'smc-tree-section',
  imports: [MatButtonModule, MatIconModule, MatTreeModule, SMCDragDirective, SMCDropTreeNodeDirective],
  templateUrl: './tree-section.html',
  styleUrl: './tree-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SMCTreeSection implements AfterViewInit {
  readonly treeTitle = input<string>('Дерево');

  readonly treeControl = viewChild(MatTree);

  readonly treeStore: ITreeStore = inject(TREE_FRAMES_STORE_TOKEN);

  readonly treeService = inject(TREE_FRAMES_SERVICE_TOKEN);

  readonly dragType = SMCDragTypeEnum;

  readonly childrenAccessor = (node: ITreeItem): ITreeItem[] => node.children ?? [];

  readonly hasChild = (_: number, node: ITreeItem): boolean => !!node.children && node.children.length > 0;

  private readonly dialogService = inject(SDialogService);

  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    this.treeStore.expandNode$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id: number) => {
      this.expandNode(id);
    });
    setTimeout(() => {
      if (this.treeStore.selectedNode()?.id) {
        const id = this.treeStore.selectedNode()?.id ?? null;
        if (id) {
          this.expandNode(id);
        }
      }
    });
  }

  handleSelectNode(node: ITreeItem | null): void {
    this.treeService.selectedNode(node);
  }

  handleExpandNode(node: ITreeItem): void {
    this.treeControl()?.expand(node);
  }

  handleDropToNode(node: ITreeItem, dropInfo: IDropInfo): void {
    if (dropInfo.dragInfo.type === SMCDragTypeEnum.TreeNode) {
      const dropNode = dropInfo.dragInfo.value as ITreeItem;
      if (node.id === dropNode.id) {
        return;
      }

      if (dropInfo.dropPosition === SMCDropPositionEnum.Center) {
        this.treeService.moveNode(dropNode.id, node.id);
      } else {
        let targetIdx = TreeHelper.getIndexById(node.id, this.treeControl()?.dataSource as ITreeItem[]);
        if (targetIdx === null) {
          return;
        }
        if (dropInfo.dropPosition === SMCDropPositionEnum.Below) {
          targetIdx++;
        }
        this.treeService.moveNode(dropNode.id, node.parentId, targetIdx);
      }
    } else if (dropInfo.dragInfo.type === SMCDragTypeEnum.Tile) {
      this.treeService.moveTileToNode(node.id, (dropInfo.dragInfo.value as IViewTile).id);
    }
    setTimeout(() => this.expandNode((dropInfo.dragInfo.value as ITreeItem).id));
  }

  handleAddNode(event: MouseEvent, node: ITreeItem | null = null): void {
    event.stopPropagation();
    this.dialogService
      .showModal<string>('Добавление ветки', SMCInputTextModal, {
        label: 'Наименование ветки',
        applyTitle: 'Добавить ветку',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value?: string) => {
        if (value !== undefined) {
          this.treeService
            .addTreeNode(value, node?.id ?? null)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              if (node) {
                setTimeout(() => this.expandNode(node.id));
              }
            });
        }
      });
  }

  handleEditNode(event: MouseEvent, node: ITreeItem): void {
    event.stopPropagation();
    this.dialogService
      .showModal<string>('Редактирование ветки', SMCInputTextModal, {
        label: 'Наименование ветки',
        applyTitle: 'Сохранить ветку',
        value: node.name,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value?: string) => {
        if (value !== undefined) {
          this.treeService
            .updateTreeNode(node.id, { name: value })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        }
      });
  }

  handleRemoveNode(event: MouseEvent, node: ITreeItem): void {
    event.stopPropagation();
    if (!this.treeService.isCanRemove(node)) {
      this.dialogService.showToastWarning('Эту ветку нельзя удалить.<br>Есть используемые фреймы');
      return;
    }
    this.dialogService
      .showConfirm(
        `Вы действительно хотите удалить ветку "${node.name}"?<br>Все объекты в этой ветке тоже будут удалены`,
        'Удаление ветки',
        'Удалить ветку',
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isOK: boolean) => {
        if (isOK) {
          this.treeService.removeTreeNode(node.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
        }
      });
  }

  private expandNode(id: number, list: ITreeItem[] = (this.treeControl()?.dataSource as ITreeItem[]) ?? []): boolean {
    for (const item of list) {
      if (item.id === id) {
        this.treeControl()?.expand(item);
        return true;
      }
      const expanded = this.expandNode(id, item.children ?? []);
      if (expanded) {
        this.treeControl()?.expand(item);
        return true;
      }
    }
    return false;
  }
}
