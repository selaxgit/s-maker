import { computed, Injectable, signal } from '@angular/core';
import { SUStringHelper } from '@selax/utils';

import { AdjustmentModeEnum } from '~core/constants';
import {
  IEditSpriteGroundPoint,
  IEditSpriteParams,
  ISprite,
  ISpriteAnimation,
  ISpriteFrame,
  ISpriteLayer,
} from '~core/interfaces';

@Injectable({
  providedIn: 'root',
})
export class EditSpriteStore {
  private readonly _sprite = signal<ISprite | null>(null);

  private readonly _layers = signal<ISpriteLayer[]>([]);

  private readonly _params = signal<IEditSpriteParams | null>(null);

  private readonly _groundPoint = signal<IEditSpriteGroundPoint | null>(null);

  private readonly _currentLayer = signal<ISpriteLayer | null>(null);

  private readonly _currentFrame = signal<ISpriteFrame | null>(null);

  readonly sprite = this._sprite.asReadonly();

  readonly layers = this._layers.asReadonly();

  readonly params = this._params.asReadonly();

  readonly groundPoint = this._groundPoint.asReadonly();

  readonly currentLayer = this._currentLayer.asReadonly();

  readonly currentFrame = this._currentFrame.asReadonly();

  private readonly _hasChanged = signal<boolean>(false);

  readonly hasChanged = this._hasChanged.asReadonly();

  private readonly _adjustmentMode = signal<AdjustmentModeEnum>(AdjustmentModeEnum.Sprite);

  readonly adjustmentMode = this._adjustmentMode.asReadonly();

  private readonly _previewAnimation = signal<ISpriteAnimation | null>(null);

  readonly previewAnimation = this._previewAnimation.asReadonly();

  readonly name = computed(() => this._sprite()?.name ?? null);

  readonly animations = computed(() => this._sprite()?.animations ?? null);

  readonly isNewSprite = computed(() => this._sprite()?.id === -1);

  removeAnimation(animationGuid: string): void {
    const currentSprite = this._sprite();
    if (currentSprite) {
      const updatedAnimations = currentSprite.animations.filter((a: ISpriteAnimation) => a.guid !== animationGuid);
      this._sprite.set({ ...currentSprite, animations: updatedAnimations });
      if (this.previewAnimation() && this.previewAnimation()!.guid === animationGuid) {
        this._previewAnimation.set(null);
      }
      this._hasChanged.set(true);
    }
  }

  setAnimation(animation: ISpriteAnimation): void {
    const currentSprite = this._sprite();
    if (currentSprite) {
      const existingAnimationIndex = currentSprite.animations.findIndex(
        (a: ISpriteAnimation) => a.guid === animation.guid,
      );
      let updatedAnimations: ISpriteAnimation[];
      if (existingAnimationIndex >= 0) {
        updatedAnimations = [...currentSprite.animations];
        updatedAnimations[existingAnimationIndex] = animation;
      } else {
        updatedAnimations = [...currentSprite.animations, animation];
      }
      this._sprite.set({ ...currentSprite, animations: updatedAnimations });
      this._hasChanged.set(true);
    }
  }

  updateCurrentFrame(params: Partial<ISpriteFrame>): void {
    const currentLayer = this._currentLayer();
    const currentFrame = this._currentFrame();
    if (currentLayer && currentFrame) {
      const updatedFrame = { ...currentFrame, ...params };
      this.updateFrame(currentLayer.guid, updatedFrame.guid, params);
    }
  }

  updateCurrentLayer(params: Partial<ISpriteLayer>): void {
    const currentLayer = this._currentLayer();
    if (currentLayer) {
      const updatedLayer = { ...currentLayer, ...params };
      this.setCurrentLayer(updatedLayer);
      this.updateLayer(updatedLayer.guid, params);
    }
  }

  updateGroundPoint(params: Partial<IEditSpriteGroundPoint>): void {
    this.updateSprite(params, false, true);
  }

  updateParams(params: Partial<IEditSpriteParams>): void {
    this.updateSprite(params, true);
  }

  removeFrame(layerGuid: string, frameGuid: string): void {
    this._layers.update((layers: ISpriteLayer[]) =>
      layers.map((l: ISpriteLayer) => {
        if (l.guid === layerGuid) {
          const updatedFrames = l.frames.filter((f: ISpriteFrame) => f.guid !== frameGuid);
          return { ...l, frames: updatedFrames };
        }
        return l;
      }),
    );
    this._sprite.update((sprite: ISprite | null) => {
      if (sprite) {
        const updatedLayers = sprite.layers.map((l: ISpriteLayer) => {
          if (l.guid === layerGuid) {
            const updatedFrames = l.frames.filter((f: ISpriteFrame) => f.guid !== frameGuid);
            return { ...l, frames: updatedFrames };
          }
          return l;
        });
        return { ...sprite, layers: updatedLayers };
      }
      return null;
    });
    const currentFrame = this.currentFrame();
    if (currentFrame && currentFrame.guid === frameGuid) {
      this.setCurrentFrame(null);
    }
    this._hasChanged.set(true);
  }

  updateFrame(layerGuid: string, frameGuid: string, fields: Partial<ISpriteFrame>): void {
    this._layers.update((layers: ISpriteLayer[]) =>
      layers.map((l: ISpriteLayer) => {
        if (l.guid === layerGuid) {
          const updatedFrames = l.frames.map((f: ISpriteFrame) => (f.guid === frameGuid ? { ...f, ...fields } : f));
          return { ...l, frames: updatedFrames };
        }
        return l;
      }),
    );
    this._sprite.update((sprite: ISprite | null) => {
      if (sprite) {
        const updatedLayers = sprite.layers.map((l: ISpriteLayer) => {
          if (l.guid === layerGuid) {
            const updatedFrames = l.frames.map((f: ISpriteFrame) => (f.guid === frameGuid ? { ...f, ...fields } : f));
            return { ...l, frames: updatedFrames };
          }
          return l;
        });
        return { ...sprite, layers: updatedLayers };
      }
      return null;
    });
    const currentLayer = this.currentLayer();
    if (currentLayer && currentLayer.guid === layerGuid) {
      this._currentLayer.set(this._layers().find((l: ISpriteLayer) => l.guid === layerGuid) || null);
      const currentFrame = this.currentFrame();
      if (this.currentLayer() && currentFrame && currentFrame.guid === frameGuid) {
        this._currentFrame.set(this.currentLayer()?.frames.find((f: ISpriteFrame) => f.guid === frameGuid) || null);
      }
    }
    this._hasChanged.set(true);
  }

  addFrameToLayer(layerGuid: string, frame: ISpriteFrame): void {
    this._layers.update((layers: ISpriteLayer[]) =>
      layers.map((l: ISpriteLayer) => (l.guid === layerGuid ? { ...l, frames: [...l.frames, frame] } : l)),
    );
    this._sprite.update((sprite: ISprite | null) => {
      if (sprite) {
        const updatedLayers = sprite.layers.map((l: ISpriteLayer) =>
          l.guid === layerGuid ? { ...l, frames: [...l.frames, frame] } : l,
        );
        return { ...sprite, layers: updatedLayers };
      }
      return null;
    });
    const currentLayer = this.currentLayer();
    if (currentLayer && currentLayer.guid === layerGuid) {
      this.setCurrentLayer({ ...currentLayer, frames: [...currentLayer.frames, frame] });
    }
    this._hasChanged.set(true);
  }

  updateLayerFramesList(layerGuid: string, frames: ISpriteFrame[]): void {
    this._layers.update((layers: ISpriteLayer[]) =>
      layers.map((l: ISpriteLayer) => (l.guid === layerGuid ? { ...l, frames } : l)),
    );
    this._sprite.update((sprite: ISprite | null) => {
      if (sprite) {
        const updatedLayers = sprite.layers.map((l: ISpriteLayer) => (l.guid === layerGuid ? { ...l, frames } : l));
        return { ...sprite, layers: updatedLayers };
      }
      return null;
    });
    const currentLayer = this.currentLayer();
    if (currentLayer && currentLayer.guid === layerGuid) {
      this.setCurrentLayer({ ...currentLayer, frames });
    }
    this._hasChanged.set(true);
  }

  updateLayersList(layers: ISpriteLayer[]): void {
    this._layers.set(layers);
    this._sprite.update((sprite: ISprite | null) => {
      if (sprite) {
        return { ...sprite, layers };
      }
      return null;
    });
    this._hasChanged.set(true);
  }

  updateAllLayers(fields: Partial<ISpriteLayer>): void {
    this._layers.update((layers: ISpriteLayer[]) => layers.map((l: ISpriteLayer) => ({ ...l, ...fields })));
    this._sprite.update((sprite: ISprite | null) => {
      if (sprite) {
        const updatedLayers = sprite.layers.map((l: ISpriteLayer) => ({ ...l, ...fields }));
        return { ...sprite, layers: updatedLayers };
      }
      return null;
    });
    this._hasChanged.set(true);
  }

  removeLayer(guid: string): void {
    this._layers.update((layers: ISpriteLayer[]) => layers.filter((l: ISpriteLayer) => l.guid !== guid));
    this._sprite.update((sprite: ISprite | null) => {
      if (sprite) {
        const updatedLayers = sprite.layers.filter((l: ISpriteLayer) => l.guid !== guid);
        return { ...sprite, layers: updatedLayers };
      }
      return null;
    });
    const currentLayer = this.currentLayer();
    if (currentLayer && currentLayer.guid === guid) {
      this.setCurrentLayer(null);
    }
    this._hasChanged.set(true);
  }

  updateLayer(guid: string, fields: Partial<ISpriteLayer>): void {
    this._layers.update((layers: ISpriteLayer[]) =>
      layers.map((l: ISpriteLayer) => (l.guid === guid ? { ...l, ...fields } : l)),
    );
    this._sprite.update((sprite: ISprite | null) => {
      if (sprite) {
        const updatedLayers = sprite.layers.map((l: ISpriteLayer) => (l.guid === guid ? { ...l, ...fields } : l));
        return { ...sprite, layers: updatedLayers };
      }
      return null;
    });
    this._hasChanged.set(true);
  }

  addLayer(layer: Partial<ISpriteLayer>): void {
    const fields = Object.assign(
      {
        guid: SUStringHelper.uuidv4(),
        name: 'Layer',
        visible: true,
        x: 0,
        y: 0,
        zIndex: 0,
        bgColor: null,
        flipHorizontal: false,
        flipVertical: false,
        frames: [],
      },
      layer,
    );
    this._layers.update((layers: ISpriteLayer[]) => [...layers, fields]);
    this._sprite.update((sprite: ISprite | null) => {
      if (sprite) {
        if (Array.isArray(sprite?.layers)) {
          sprite.layers.push(fields);
        }
        return Object.assign({}, sprite);
      }
      return null;
    });
    this.setCurrentLayer(fields);
    this._hasChanged.set(true);
  }

  updateSprite(params: Partial<ISprite>, updateParams: boolean = false, updateGroundPoint: boolean = false): void {
    const currentSprite = this._sprite();
    if (currentSprite) {
      this._sprite.set({ ...currentSprite, ...params });
      if (updateParams) {
        this._params.set({
          width: this._sprite()!.width,
          height: this._sprite()!.height,
          bgColor: this._sprite()!.bgColor,
        });
      }
      if (updateGroundPoint) {
        this._groundPoint.set({
          groundPointX: this._sprite()!.groundPointX,
          groundPointY: this._sprite()!.groundPointY,
          visibleGroundPoint: this._sprite()!.visibleGroundPoint,
        });
      }
      this._hasChanged.set(true);
    }
  }

  setCurrentLayer(layer: ISpriteLayer | null): void {
    this._currentLayer.set(layer);
    this._currentFrame.set(null);
  }

  setCurrentFrame(frame: ISpriteFrame | null): void {
    this._currentFrame.set(frame);
  }

  setAdjustmentMode(mode: AdjustmentModeEnum): void {
    this._adjustmentMode.set(mode);
  }

  setPreviewAnimation(animation: ISpriteAnimation | null): void {
    this._previewAnimation.set(animation);
  }

  setHasChanged(hasChanged: boolean): void {
    this._hasChanged.set(hasChanged);
  }

  setSprite(sprite: ISprite): void {
    this._sprite.set(sprite);
    this._layers.set(sprite.layers || []);
    this._params.set({
      width: sprite.width,
      height: sprite.height,
      bgColor: sprite.bgColor,
    });
    this._hasChanged.set(false);
  }

  reset(): void {
    this._sprite.set(null);
    this._layers.set([]);
    this._params.set(null);
    this._currentLayer.set(null);
    this._currentFrame.set(null);
    this._hasChanged.set(false);
  }
}
