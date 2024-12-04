import { Container, DestroyOptions, FederatedPointerEvent, Graphics } from 'pixi.js';
import { Subject, takeUntil } from 'rxjs';

import { EditorToolStateType, ICoords, IRect, ISceneObject, IStoreKeyCanvas } from '../../../../../common/interfaces';
import { FramesCacheService } from '../../../../../common/services/cache';
import { SpritesService } from '../../../../../common/services/sprites';
import { TilesGridService } from '../../../../../common/services/tiles';
import { CanActionType, ICurrentObject, ResizeAsCursorType } from './constants';
import { LayersContainer } from './layers.container';

interface IMouseState {
  mouseX: number;
  mouseY: number;
  objectX: number;
  objectY: number;
  objectWidth: number | null;
  objectHeight: number | null;
  resizeAsCursor: ResizeAsCursorType | null;
  action: CanActionType | null;
}

export interface IUpdateObjectXYWHEvent {
  objectId: number;
  rect: IRect;
}

export class DrawContainer extends Container {
  public drawCoordsEvent = new Subject<ICoords | null>();

  public selectObjectEvent = new Subject<number>();

  public updateObjectXYWHEvent = new Subject<IUpdateObjectXYWHEvent>();

  public updateCursorEvent = new Subject<string | null>();

  private toolStateValue: EditorToolStateType = 'move';

  private sceneWidth = 0;

  private sceneHeight = 0;

  private rectBg = new Graphics();

  private hUnsubscribe = new Subject<void>();

  private currentObject: ICurrentObject | null = null;

  private dragObject: ICurrentObject | null = null;

  private mouseState: IMouseState | null = null;

  private layersContainer = new LayersContainer(
    this.tilesGridService,
    this.framesCacheService,
    this.spritesService,
    (width: number, height: number): void => {
      if (width > this.sceneWidth || height > this.sceneHeight) {
        this.updateSceneRect(width, height);
      }
    },
  );

  constructor(
    private readonly tilesGridService: TilesGridService,
    private readonly framesCacheService: FramesCacheService,
    private readonly spritesService: SpritesService,
  ) {
    super();
    this.eventMode = 'static';
    this.sortableChildren = true;
    this.rectBg.zIndex = 0;
    this.addChild(this.rectBg);
    this.layersContainer.zIndex = 1;
    this.addChild(this.layersContainer);
    this.layersContainer.objectEnterEvent.pipe(takeUntil(this.hUnsubscribe)).subscribe((object: ICurrentObject) => {
      this.currentObject = object;
    });
    this.layersContainer.objectLeaveEvent.pipe(takeUntil(this.hUnsubscribe)).subscribe(() => {
      this.currentObject = null;
    });
    this.on('pointermove', (e: FederatedPointerEvent) => {
      this.drawCoordsEvent.next({ x: e.globalX + Math.abs(this.x), y: e.globalY + Math.abs(this.y) });
      if (this.mouseState && this.dragObject) {
        if (typeof this.dragObject.onCanAction === 'function') {
          const dx = e.clientX - this.mouseState.mouseX;
          const dy = e.clientY - this.mouseState.mouseY;
          switch (this.mouseState.action) {
            case 'drag':
              if (typeof this.dragObject.onUpdateXY === 'function') {
                this.dragObject.onUpdateXY({ x: dx + this.mouseState.objectX, y: dy + this.mouseState.objectY });
              }
              break;
            case 'resize':
              if (
                typeof this.dragObject.onResize === 'function' &&
                this.mouseState.objectWidth &&
                this.mouseState.objectHeight
              ) {
                this.dragObject.onResize(
                  { x: this.mouseState.objectX, y: this.mouseState.objectY },
                  { x: dx, y: dy },
                  { width: this.mouseState.objectWidth, height: this.mouseState.objectHeight },
                  this.mouseState.resizeAsCursor,
                );
              }
              break;
          }
        }
      }
    })
      .on('pointerleave', () => {
        this.drawCoordsEvent.next(null);
      })
      .on('pointerdown', (e: FederatedPointerEvent) => {
        if (!this.currentObject) {
          return;
        }
        if (['info', 'drag-object'].includes(this.toolStateValue)) {
          this.selectObjectEvent.next(this.currentObject.objectId);
        }
        if (
          this.toolStateValue === 'drag-object' &&
          typeof this.currentObject.x === 'number' &&
          typeof this.currentObject.y === 'number'
        ) {
          let resizeAsCursor: ResizeAsCursorType | null = null;
          if (typeof this.currentObject.onGetCursor === 'function') {
            resizeAsCursor = this.currentObject.onGetCursor();
            this.updateCursorEvent.next(resizeAsCursor);
          }
          if (typeof this.currentObject.onDragState === 'function') {
            this.currentObject.onDragState(true);
          }
          this.dragObject = this.currentObject;
          this.mouseState = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            objectX: this.currentObject.x,
            objectY: this.currentObject.y,
            objectWidth: this.currentObject.width ?? null,
            objectHeight: this.currentObject.height ?? null,
            resizeAsCursor,
            action: typeof this.currentObject.onCanAction === 'function' ? this.currentObject.onCanAction() : null,
          };
        }
      })
      .on('pointerup', () => {
        this.mouseState = null;
        this.updateCursorEvent.next(null);
        if (typeof this.dragObject?.onDragState === 'function') {
          this.dragObject.onDragState(false);
        }
        if (this.dragObject && typeof this.dragObject.onGetXYWH === 'function') {
          const xywh = this.dragObject.onGetXYWH();
          if (xywh) {
            this.updateObjectXYWHEvent.next({
              objectId: this.dragObject.objectId,
              rect: xywh,
            });
          }
        }
      });
  }

  public set toolState(value: EditorToolStateType) {
    this.toolStateValue = value;
    this.layersContainer.toolState = value;
  }

  public override destroy(options?: DestroyOptions): void {
    this.hUnsubscribe.next();
    this.hUnsubscribe.complete();
    super.destroy(options);
  }

  public updateFramesStore(store: IStoreKeyCanvas): void {
    this.layersContainer.updateFramesStore(store);
  }

  public updateSceneObjects(sceneObjects: ISceneObject[]): void {
    this.layersContainer.updateSceneObjects(sceneObjects);
  }

  public updateSceneRect(width: number, height: number): void {
    this.sceneWidth = width;
    this.sceneHeight = height;
    this.rectBg.clear().rect(0, 0, width, height).fill({
      color: 0x000000,
      alpha: 0.001,
    });
  }
}
