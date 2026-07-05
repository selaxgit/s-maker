import { SceneLayerTypeEnum } from '~core/constants';
import { SceneObjectType } from '~core/interfaces';

import { BaseLayerContainer } from '../base-layer.container';
import { BaseObjectContainer } from '../base-object.container';
import { RectObjectContainer } from '../objects/rect-object.container';

export class LayerEventsGroundContainer extends BaseLayerContainer {
  constructor(
    override readonly typeLayer: SceneLayerTypeEnum,
    override readonly guidLayer: string,
    private readonly bgColor: number,
  ) {
    super(typeLayer, guidLayer);
  }

  protected override createObject(objectInfo: SceneObjectType): BaseObjectContainer | null {
    return new RectObjectContainer(this.typeLayer, this.guidLayer, objectInfo.guid, this.bgColor);
  }
}
