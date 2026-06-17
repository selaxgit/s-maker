import { Container, DestroyOptions } from 'pixi.js';

import { SceneLayerTypeEnum } from '~core/constants';
import { ISceneObjectSprite } from '~core/interfaces';

import { SBDrawSceneService } from '../../services';
import { IPixiSceneLayer, ISceneLayerMouseEvent } from './interfaces';
import { SpriteContainer } from './sprite.container';

export class LayerSpritesContainer extends Container implements IPixiSceneLayer {
  typeLayer: SceneLayerTypeEnum | null = null;

  guidLayer: string | null = null;

  onObjectMouseMove: ((info: ISceneLayerMouseEvent) => void) | null = null;

  onObjectMouseLeave: (() => void) | null = null;

  onSpritePlayChanged: ((guidLayer: string, guidObject: string, playing: boolean) => void) | null = null;

  private sprites = new Map<string, SpriteContainer>();

  constructor(private readonly drawSceneService: SBDrawSceneService) {
    super();
  }

  override destroy(options?: DestroyOptions): void {
    for (const sprite of this.sprites.values()) {
      sprite.destroy();
    }
    this.sprites.clear();
    super.destroy(options);
  }

  selectedObject(guidObject: string | null): void {
    for (const [guid, object] of this.sprites.entries()) {
      object.selectedObject(guid === guidObject);
    }
  }

  async drawObjects(objectsInfo: ISceneObjectSprite[]): Promise<void> {
    const guids = objectsInfo.map((sprite: ISceneObjectSprite) => sprite.guid);
    for (const [guid, sprite] of this.sprites.entries()) {
      if (!guids.includes(guid)) {
        this.sprites.delete(guid);
        sprite.destroy();
      }
    }
    for (const spriteInfo of objectsInfo) {
      await this.updateSprite(spriteInfo);
    }
  }

  private async updateSprite(spriteInfo: ISceneObjectSprite): Promise<void> {
    let spriteContainer = this.sprites.get(spriteInfo.guid);
    if (!spriteContainer) {
      spriteContainer = new SpriteContainer(spriteInfo.guid, this.drawSceneService);
      await spriteContainer.initSprite(spriteInfo);
      this.addChild(spriteContainer);
      this.sprites.set(spriteInfo.guid, spriteContainer);
      spriteContainer.onPlayChanged = (guidObject: string, playing: boolean) => {
        if (typeof this.onSpritePlayChanged === 'function') {
          this.onSpritePlayChanged(this.guidLayer!, guidObject, playing);
        }
      };
      spriteContainer.onObjectMouseMove = (guidObject: string, object: SpriteContainer) => {
        if (typeof this.onObjectMouseMove === 'function') {
          this.onObjectMouseMove({
            typeLayer: this.typeLayer!,
            guidLayer: this.guidLayer!,
            guidObject,
            object,
            data: null,
          });
        }
      };
      spriteContainer.onObjectMouseLeave = () => {
        if (typeof this.onObjectMouseLeave === 'function') {
          this.onObjectMouseLeave();
        }
      };
    } else {
      await spriteContainer.updateSprite(spriteInfo);
    }
  }
}
