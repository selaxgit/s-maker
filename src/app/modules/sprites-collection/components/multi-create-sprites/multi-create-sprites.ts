import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ISNavItem, SInputComponent, STreeMenuComponent } from '@selax/ui';
import { lastValueFrom } from 'rxjs';

import { FramesTreeRepository, SpritesRepository } from '~core/repositories';
import { SpriteService } from '~core/services';
import { FramesTreeStore, ProjectStore, SpritesTreeStore } from '~core/stores';
import { SMFileDropDirective } from '~directives/file-drop.directive';
import { ITreeItem } from '~interfaces/tree.interface';

@Component({
  selector: 'sc-multi-create-sprites',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    SInputComponent,
    STreeMenuComponent,
    SMFileDropDirective,
  ],
  templateUrl: './multi-create-sprites.html',
  styleUrl: './multi-create-sprites.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SCMultiCreateSprites implements OnInit {
  readonly isProcessingState = signal<boolean>(false);

  readonly processingMessage = signal<string>('');

  readonly treeMenuList = signal<ISNavItem[]>([]);

  readonly fileList = signal<File[]>([]);

  framesTreeName = '';

  dialogRef!: MatDialogRef<SCMultiCreateSprites>;

  private readonly destroyRef = inject(DestroyRef);

  private readonly projectStore = inject(ProjectStore);

  readonly framesTreeStore = inject(FramesTreeStore);

  readonly framesTreeRepository = inject(FramesTreeRepository);

  readonly spritesTreeStore = inject(SpritesTreeStore);

  readonly spritesRepository = inject(SpritesRepository);

  readonly spritesService = inject(SpriteService);

  private framesTreeId: number | null = null;

  ngOnInit(): void {
    const toTree = (items: ITreeItem[]): ISNavItem[] => {
      return items.map((i: ITreeItem) => ({
        displayName: i.name,
        children: toTree(i.children),
        data: i,
      }));
    };
    this.treeMenuList.set(toTree(this.framesTreeStore.tree()));
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

  onItemMenuClick(item: ISNavItem): void {
    this.framesTreeName = item.displayName;
    this.framesTreeId = (item.data as ITreeItem).id;
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
      this.framesTreeId = null;
    }
  }

  async onGenerate(): Promise<void> {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      return;
    }
    if (!this.framesTreeId && Boolean(this.framesTreeName)) {
      const node = await lastValueFrom(this.framesTreeRepository.addTreeNode(this.framesTreeName));
      this.framesTreeId = node.id;
    }
    const spriteTreeId = this.spritesTreeStore.selectedNode()?.id ?? null;
    this.processingMessage.set('Генерация спрайтов...');
    this.isProcessingState.set(true);
    await this.spritesService.multiCreateSprites(
      projectId,
      this.framesTreeId,
      spriteTreeId,
      this.fileList(),
      (message: string) => {
        this.processingMessage.set(message);
      },
    );
    this.spritesRepository
      .fetchSprites(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isProcessingState.set(false);
      });
    this.dialogRef?.close();
  }

  onClose(): void {
    this.dialogRef?.close();
  }
}
