import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { INavItem, JSTFileDropDirective, JSTInputModule, JSTTreeMenuModule } from '@jst/ui';
import { lastValueFrom } from 'rxjs';

import { ITreeItem } from '../../../common/interfaces';
import { FramesService, FramesTreeDBService } from '../../../common/services/frames';
import { SpriteLayersService, SpritesService } from '../../../common/services/sprites';
import { SpriteFramesService } from '../../../common/services/sprites/sprite-frames.service';
import { TreeService } from '../../../common/services/tree';

@Component({
    selector: 'sc-sprite-multi-create-list',
    imports: [
        CommonModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatMenuModule,
        JSTInputModule,
        JSTTreeMenuModule,
        JSTFileDropDirective,
    ],
    providers: [TreeService],
    templateUrl: './sprite-multi-create.component.html',
    styleUrl: './sprite-multi-create.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SCSpriteMultiCreateComponent implements OnInit {
  dialogRef!: MatDialogRef<SCSpriteMultiCreateComponent>;

  isProcessing: WritableSignal<boolean> = signal(false);

  processingMessage: WritableSignal<string> = signal('');

  fileList: WritableSignal<File[]> = signal([]);

  treeMenuList: INavItem[] = [];

  public treeName = '';

  private projectId: number | null = null;

  private treeId: number | null = null;

  private spriteTreeId: number | null = null;

  constructor(
    private readonly treeService: TreeService,
    private readonly framesTreeDBService: FramesTreeDBService,
    protected readonly spriteFramesService: SpriteFramesService,
    protected readonly framesService: FramesService,
    protected readonly spritesService: SpritesService,
    protected readonly spriteLayersService: SpriteLayersService,
  ) {
    this.treeService.setBaseService(this.framesTreeDBService);
  }

  ngOnInit(): void {
    if (!this.projectId) {
      return;
    }
    this.treeService.fetchTreeList(this.projectId).subscribe((tree: ITreeItem[]) => {
      const toTree = (items: ITreeItem[]): INavItem[] => {
        return items.map((i: ITreeItem) => ({
          displayName: i.name,
          children: toTree(i.children),
          data: i,
        }));
      };
      this.treeMenuList = toTree(tree);
    });
  }

  async onGenerate(): Promise<void> {
    if (!this.projectId || this.fileList().length === 0) {
      return;
    }
    this.processingMessage.set('Генерация спрайтов...');
    this.isProcessing.set(true);
    await this.generateSprites();
    this.dialogRef?.close({ isOK: true });
  }

  onRemoveFile(idx: number): void {
    this.fileList.update((value: File[]) => {
      value.splice(idx, 1);
      return [...value];
    });
  }

  onFileDrop(files: File[]): void {
    this.fileList.set(files);
  }

  onItemMenuClick(item: INavItem): void {
    this.treeName = item.displayName;
    this.treeId = item.data.id;
  }

  setData(data: { projectId: number; spriteTreeId: number }): void {
    this.projectId = data.projectId ?? null;
    this.spriteTreeId = data.spriteTreeId ?? null;
  }

  onTreeNameKeyUp(e: KeyboardEvent): void {
    if (
      ![
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Escape',
        'ShiftRight',
        'ShiftLeft',
        'ControlLeft',
        'ControlRight',
      ].includes(e.code)
    ) {
      this.treeId = null;
    }
  }

  onClose(): void {
    this.dialogRef?.close();
  }

  private async generateSprites(): Promise<void> {
    if (!this.projectId || this.fileList().length === 0) {
      return;
    }
    if (!this.treeId) {
      if (!this.treeName) {
        this.treeId = null;
      } else {
        const frameTree = await lastValueFrom(
          this.framesTreeDBService.insert({
            projectId: this.projectId,
            parentId: null,
            name: this.treeName,
          }),
        );
        if (frameTree) {
          this.treeId = frameTree.id;
        }
      }
    }
    const count = this.fileList().length;
    let idx = 1;
    for (const file of this.fileList()) {
      this.processingMessage.set(`Генерация спрайтов (${idx} из ${count})...`);
      idx++;
      await this.createSprite(file, this.treeId);
    }
  }

  private async createSprite(file: File, treeId: number | null): Promise<void> {
    if (!this.projectId) {
      return;
    }
    const frame = await lastValueFrom(this.framesService.add(this.projectId, treeId, file));
    const sprite = await lastValueFrom(
      this.spritesService.insert({
        projectId: this.projectId,
        treeId: this.spriteTreeId,
        name: file.name,
        width: frame.width,
        height: frame.height,
        bgColor: null,
        groundPointX: null,
        groundPointY: null,
        visibleGroundPoint: false,
      }),
    );
    const layer = await lastValueFrom(
      this.spriteLayersService.insert({
        projectId: this.projectId,
        spriteId: sprite.id,
        name: 'def',
        visible: true,
        x: 0,
        y: 0,
        zIndex: 0,
        bgColor: null,
        flipHorizontal: false,
        flipVertical: false,
      }),
    );
    await lastValueFrom(
      this.spriteFramesService.insert({
        projectId: this.projectId,
        spriteId: sprite.id,
        layerId: layer.id,
        frameId: frame.id,
        name: 'Frame 1',
        x: 0,
        y: 0,
        width: frame.width,
        height: frame.height,
        visible: true,
      }),
    );
  }
}
