import { SceneObjectType } from '~core/interfaces';

import { BaseLayerContainer } from '../base-layer.container';
import { BaseObjectContainer } from '../base-object.container';
import { SpriteObjectContainer } from '../objects/sprite-object.container';

export class LayerSpritesContainer extends BaseLayerContainer {
  onSpritePlayChanged: ((guidLayer: string, guidObject: string, playing: boolean) => void) | null = null;

  protected override createObject(objectInfo: SceneObjectType): BaseObjectContainer | null {
    const object = new SpriteObjectContainer(this.typeLayer, this.guidLayer, objectInfo.guid, this.drawSceneService);
    object.onPlayChanged = (guidObject: string, playing: boolean) => {
      if (typeof this.onSpritePlayChanged === 'function') {
        this.onSpritePlayChanged(this.guidLayer, guidObject, playing);
      }
    };
    return object;
  }
}
