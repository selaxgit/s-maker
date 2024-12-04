import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostBinding,
  inject,
  OnDestroy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AppPixi } from '../../../../common/classes';
import {
  EditorToolStateType,
  ICoords,
  IScene,
  ISceneObject,
  IStoreKeyCanvas,
  ZoomType,
} from '../../../../common/interfaces';
import { FramesCacheService } from '../../../../common/services/cache';
import { SpritesService } from '../../../../common/services/sprites';
import { TilesGridService } from '../../../../common/services/tiles';
import { ScenesStore } from '../../../../stores/scenes.store';
import { DrawContainer, IUpdateObjectXYWHEvent } from './pixi/draw.container';

@Component({
    selector: 'sb-edit-draw',
    imports: [CommonModule],
    template: '',
    styleUrl: './draw.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SBEditDrawComponent implements AfterViewInit, OnDestroy {
  private readonly appPixi = new AppPixi();

  private readonly drawContainer = new DrawContainer(
    this.tilesGridService,
    this.framesCacheService,
    this.spritesService,
  );

  private cursor = 'move';

  private toolState: EditorToolStateType = 'move';

  private lastToolState: EditorToolStateType | null = null;

  private readonly destroyRef$ = inject(DestroyRef);

  constructor(
    public readonly scenesStore: ScenesStore,
    private readonly elementRef: ElementRef,
    private readonly framesCacheService: FramesCacheService,
    private readonly tilesGridService: TilesGridService,
    private readonly spritesService: SpritesService,
  ) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  @HostBinding('style.cursor') get cursorStyle(): string {
    return this.cursor;
  }

  ngAfterViewInit(): void {
    this.initializePixi();
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.appPixi.destroy();
  }

  private initializePixi(): void {
    this.appPixi.useScale = true;
    this.appPixi.initialize(this.elementRef.nativeElement).then(() => {
      this.appPixi.attachScaleContainer(this.drawContainer);
      const screenBox = this.elementRef.nativeElement.getBoundingClientRect();
      this.scenesStore.sendDrawContainerRect({
        x: this.drawContainer.x / this.drawContainer.scale.x,
        y: this.drawContainer.y / this.drawContainer.scale.y,
        width: screenBox.width / this.drawContainer.scale.x,
        height: screenBox.height / this.drawContainer.scale.y,
      });
      this.initializeSubscriptions();
    });
  }

  private initializeSubscriptions(): void {
    this.scenesStore.currentScene$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((scene: IScene | null) => {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      this.drawContainer.updateSceneRect(scene?.width ?? 1024, scene?.height ?? 768);
    });
    // Должно быть перед подпиской на объекты
    this.scenesStore.framesStore$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((store: IStoreKeyCanvas | null) => {
        if (store) {
          this.drawContainer.updateFramesStore(store);
        }
      });
    this.scenesStore.editorSceneObjects$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((sceneObjects: ISceneObject[]) => {
        this.drawContainer.updateSceneObjects(sceneObjects);
      });

    this.scenesStore.editorToolState$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((state: EditorToolStateType) => {
        this.toolState = state;
        this.drawContainer.toolState = state;
        this.appPixi.useMove = state === 'move';
        this.updateCursor();
      });

    this.scenesStore.editorZoomEvent$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((zoom: ZoomType) => {
      this.appPixi.setZoom(zoom);
    });

    this.appPixi.onZoomDone = () => {
      const screenBox = this.elementRef.nativeElement.getBoundingClientRect();
      this.scenesStore.sendDrawContainerRect({
        x: this.drawContainer.x / this.drawContainer.scale.x,
        y: this.drawContainer.y / this.drawContainer.scale.y,
        width: screenBox.width / this.drawContainer.scale.x,
        height: screenBox.height / this.drawContainer.scale.y,
      });
    };
    this.appPixi.onMoveDone = () => {
      const screenBox = this.elementRef.nativeElement.getBoundingClientRect();
      this.scenesStore.sendDrawContainerRect({
        x: this.drawContainer.x / this.drawContainer.scale.x,
        y: this.drawContainer.y / this.drawContainer.scale.y,
        width: screenBox.width / this.drawContainer.scale.x,
        height: screenBox.height / this.drawContainer.scale.y,
      });
    };

    this.drawContainer.drawCoordsEvent
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((coords: ICoords | null) => {
        this.scenesStore.sendEditorCoords(coords);
      });
    this.drawContainer.selectObjectEvent.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((objectId: number) => {
      this.scenesStore.selectObjectById(objectId);
    });
    this.drawContainer.updateObjectXYWHEvent
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((info: IUpdateObjectXYWHEvent) => {
        this.scenesStore.updateSceneObject(null, info.objectId, {
          x: info.rect.x,
          y: info.rect.y,
          width: info.rect.width,
          height: info.rect.height,
        });
      });
    this.drawContainer.updateCursorEvent
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((cursor: string | null) => {
        if (cursor) {
          this.cursor = cursor;
        } else {
          this.updateCursor();
        }
      });
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (document.activeElement?.tagName === 'INPUT') {
      return;
    }
    if (this.toolState !== 'move') {
      switch (e.code) {
        case 'Space':
          this.lastToolState = this.toolState;
          this.scenesStore.setEditorToolState('move');
          break;
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (document.activeElement?.tagName === 'INPUT') {
      return;
    }
    if (e.code === 'Space' && this.lastToolState) {
      this.scenesStore.setEditorToolState(this.lastToolState);
      this.lastToolState = null;
    }
  };

  private updateCursor(): void {
    switch (this.toolState) {
      case 'move':
        this.cursor = 'move';
        break;
      case 'info':
        this.cursor = 'help';
        break;
      case 'remove':
        this.cursor = 'crosshair';
        break;
      case 'draw':
        this.cursor = 'grabbing';
        break;
      case 'drag-object':
        this.cursor = 'alias';
        break;
      default:
        this.cursor = 'default';
    }
  }
}
