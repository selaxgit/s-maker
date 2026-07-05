import { SceneObjectType } from '~core/interfaces';

import { BaseLayerContainer } from '../base-layer.container';
import { BaseObjectContainer } from '../base-object.container';
import { FrameObjectContainer } from '../objects/frame-object.container';

export class LayerFramesContainer extends BaseLayerContainer {
  protected override createObject(objectInfo: SceneObjectType): BaseObjectContainer | null {
    return new FrameObjectContainer(this.typeLayer, this.guidLayer, objectInfo.guid, this.drawSceneService);
  }
}
