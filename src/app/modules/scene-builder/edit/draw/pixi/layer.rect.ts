import { DestroyOptions } from 'pixi.js';
import { Subject, takeUntil } from 'rxjs';

import {
  EditorToolStateType,
  ICoords,
  ISceneObject,
  IWidthHeight,
  SceneObjectType,
} from '../../../../../common/interfaces';
import { BaseLayer } from './base.layer';
import { ResizeAsCursorType } from './constants';
import { RectGraphics } from './rect.graphics';

export class LayerRect extends BaseLayer {
  private objects: Map<number, RectGraphics> = new Map();

  private hUnsubscribe = new Subject<void>();

  constructor(
    private readonly bgColor: number,
    private readonly objectType: SceneObjectType,
  ) {
    super();
  }

  public override set toolState(value: EditorToolStateType) {
    super.toolState = value;
    this.objects.forEach((rect: RectGraphics) => (rect.toolState = value));
  }

  public override destroy(options?: DestroyOptions): void {
    this.hUnsubscribe.next();
    this.hUnsubscribe.complete();
    this.objects.forEach((sprite: RectGraphics) => sprite.destroy());
    this.objects.clear();
    super.destroy(options);
  }

  public override async updateLayer(object: ISceneObject): Promise<void> {
    super.updateLayer(object);
    this.zIndex = 1000;
    const realIds: number[] = [];
    for (const child of object.children) {
      this.updateChild(child);
      realIds.push(child.id);
    }
    this.objects.forEach((sprite: RectGraphics, key: number) => {
      if (!realIds.includes(key)) {
        sprite.destroy();
        this.objects.delete(key);
      }
    });
  }

  private updateChild(child: ISceneObject): void {
    let objRect: RectGraphics | null = null;
    if (this.objects.has(child.id)) {
      objRect = this.objects.get(child.id) as RectGraphics;
    } else {
      objRect = new RectGraphics(child.id, this.bgColor);
      this.addChild(objRect);
      this.objects.set(child.id, objRect);
      objRect.mouseEnterEvent.pipe(takeUntil(this.hUnsubscribe)).subscribe((obj: RectGraphics) => {
        const rect = obj.onGetXYWH();
        this.objectEnterEvent.next({
          objectId: obj.objectId,
          type: this.objectType,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          onUpdateXY: (coords: ICoords) => obj.onUpdateXY(coords),
          onGetXYWH: () => obj.onGetXYWH(),
          onCanAction: () => obj.onCanAction(),
          onGetCursor: () => obj.onGetCursor(),
          onResize: (
            lastXY: ICoords,
            offsetXY: ICoords,
            oldWH: IWidthHeight,
            resizeAsCursor: ResizeAsCursorType | null,
          ) => obj.onResize(lastXY, offsetXY, oldWH, resizeAsCursor),
          onDragState: (value: boolean) => obj.onDragState(value),
        });
      });
      objRect.mouseLeaveEvent.pipe(takeUntil(this.hUnsubscribe)).subscribe((obj: RectGraphics) => {
        this.objectLeaveEvent.next({
          objectId: obj.objectId,
          type: this.objectType,
        });
      });
    }
    if (objRect) {
      objRect.updateObject(child);
    }
  }
}
