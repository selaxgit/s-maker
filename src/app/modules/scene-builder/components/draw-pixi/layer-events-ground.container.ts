import { Container, DestroyOptions } from 'pixi.js';

import { SceneLayerTypeEnum } from '~core/constants';
import { ISceneObjectEventsGround } from '~core/interfaces';

import { IPixiSceneLayer, ISceneLayerMouseEvent } from './interfaces';
import { IRectGraphicsEvent, RectGraphics } from './rect.graphics';

export class LayerEventsGroundContainer extends Container implements IPixiSceneLayer {
  typeLayer: SceneLayerTypeEnum | null = null;

  guidLayer: string | null = null;

  onObjectMouseMove: ((info: ISceneLayerMouseEvent) => void) | null = null;

  onObjectMouseLeave: (() => void) | null = null;

  private objects = new Map<string, RectGraphics>();

  constructor(private readonly bgColor: number) {
    super();
  }

  override destroy(options?: DestroyOptions): void {
    for (const object of this.objects.values()) {
      object.destroy();
    }
    this.objects.clear();
    super.destroy(options);
  }

  selectedObject(guidObject: string | null): void {
    for (const [guid, object] of this.objects.entries()) {
      object.selectedObject(guid === guidObject);
    }
  }

  async drawObjects(objectsInfo: ISceneObjectEventsGround[]): Promise<void> {
    const guids = objectsInfo.map((obj: ISceneObjectEventsGround) => obj.guid);
    for (const [guid, object] of this.objects.entries()) {
      if (!guids.includes(guid)) {
        this.objects.delete(guid);
        object.destroy();
      }
    }
    for (const object of objectsInfo) {
      this.updateObject(object);
    }
  }

  private updateObject(object: ISceneObjectEventsGround): void {
    let objRect = this.objects.get(object.guid);
    if (!objRect) {
      objRect = new RectGraphics(object.guid, this.bgColor);
      this.addChild(objRect);
      this.objects.set(object.guid, objRect);
      objRect.onObjectMouseMove = (info: IRectGraphicsEvent) => {
        if (typeof this.onObjectMouseMove === 'function') {
          this.onObjectMouseMove({
            typeLayer: this.typeLayer!,
            guidLayer: this.guidLayer!,
            guidObject: info.object.guidObject,
            object: info.object,
            data: info.data,
          });
        }
      };
      objRect.onObjectMouseLeave = () => {
        if (typeof this.onObjectMouseLeave === 'function') {
          this.onObjectMouseLeave();
        }
      };
    }
    if (objRect) {
      objRect.updateObject(object);
    }
  }
}
