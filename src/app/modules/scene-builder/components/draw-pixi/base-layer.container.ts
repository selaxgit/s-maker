import { Container, DestroyOptions, FederatedPointerEvent, Graphics } from 'pixi.js';

import { SceneLayerTypeEnum } from '~core/constants';
import { ISceneLayer, SceneObjectType } from '~core/interfaces';

import { SBDrawSceneService } from '../../services';
import { BaseObjectContainer } from './base-object.container';

export abstract class BaseLayerContainer extends Container {
  protected readonly objects = new Map<string, BaseObjectContainer>();

  protected ordersObjectsKeys: string[] = [];

  private bgGraphics = new Graphics();

  constructor(
    readonly typeLayer: SceneLayerTypeEnum,
    readonly guidLayer: string,
    protected readonly drawSceneService: SBDrawSceneService | null = null,
  ) {
    super();
    this.addChild(this.bgGraphics);
  }

  override destroy(options?: DestroyOptions): void {
    super.destroy(options);
  }

  selectObject(guidObject: string | null): BaseObjectContainer | null {
    let selectedObject = null;
    for (const [guid, object] of this.objects.entries()) {
      object.selectObject(guid === guidObject);
      if (guid === guidObject) {
        selectedObject = object;
      }
    }
    return selectedObject;
  }

  async drawLayer(layerInfo: ISceneLayer): Promise<void> {
    let changeOrdersObjects = this.objects.size === 0;
    const guids = layerInfo.objects.map((obj: SceneObjectType) => obj.guid);
    for (const [guid, object] of this.objects.entries()) {
      if (!guids.includes(guid)) {
        this.objects.delete(guid);
        object.destroy();
        changeOrdersObjects = true;
      }
    }
    for (const objectInfo of layerInfo.objects) {
      let objectContainer = this.objects.get(objectInfo.guid) ?? null;
      if (!objectContainer) {
        objectContainer = this.createObject(objectInfo);
        if (objectContainer) {
          changeOrdersObjects = true;
          this.objects.set(objectInfo.guid, objectContainer);
          this.addChild(objectContainer);
        }
      }
      if (objectContainer) {
        if (objectContainer.zIndex !== objectInfo.zIndex) {
          changeOrdersObjects = true;
        }
        objectContainer.x = objectInfo.x;
        objectContainer.y = objectInfo.y;
        objectContainer.zIndex = objectInfo.zIndex;
        objectContainer.visible = objectInfo.visible;
        if (objectContainer.visible) {
          await objectContainer.drawObject(objectInfo);
        }
      }
    }
    this.bgGraphics.clear().rect(0, 0, this.width, this.height).fill({
      color: 0x000000,
      alpha: 0.001,
    });
    if (changeOrdersObjects) {
      this.ordersObjectsKeys = [...this.objects.values()]
        .sort((a: BaseObjectContainer, b: BaseObjectContainer) => b.zIndex - a.zIndex)
        .map((item: BaseObjectContainer) => item.guidObject);
    }
  }

  protected createObject(_: SceneObjectType): BaseObjectContainer | null {
    return null;
  }

  getObjectAtCursor(e: FederatedPointerEvent): BaseObjectContainer | null {
    for (const guid of this.ordersObjectsKeys) {
      const object = this.objects.get(guid)?.getObjectAtCursor(e);
      if (object) {
        return object;
      }
    }
    return null;
  }
}
