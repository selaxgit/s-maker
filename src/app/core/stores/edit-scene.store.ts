import { computed, Injectable, signal } from '@angular/core';
import { SUStringHelper } from '@selax/utils';
import { Subject } from 'rxjs';

import { PropertiesType } from '~constants/common.constants';
import { SceneLayerTypeEnum } from '~core/constants';
import { IScene, ISceneLayer, SceneObjectType } from '~core/interfaces';
import { AppPixiStateEnum, ZoomEnum } from '~pixijs/interfaces';

@Injectable({
  providedIn: 'root',
})
export class EditSceneStore {
  private readonly _scene = signal<IScene | null>(null);

  private readonly _layers = signal<ISceneLayer[]>([]);

  private readonly _currentLayer = signal<ISceneLayer | null>(null);

  private readonly _currentObject = signal<SceneObjectType | null>(null);

  private readonly _hasChanged = signal<boolean>(false);

  private readonly _toolbarState = signal<AppPixiStateEnum>(AppPixiStateEnum.Move);

  private readonly _statusbarText = signal<string | null>(null);

  private readonly zoomState = new Subject<ZoomEnum>();

  readonly scene = this._scene.asReadonly();

  readonly layers = this._layers.asReadonly();

  readonly currentLayer = this._currentLayer.asReadonly();

  readonly currentObject = this._currentObject.asReadonly();

  readonly hasChanged = this._hasChanged.asReadonly();

  readonly toolbarState = this._toolbarState.asReadonly();

  readonly statusbarText = this._statusbarText.asReadonly();

  readonly zoomState$ = this.zoomState.asObservable();

  readonly sceneName = computed(() => this._scene()?.name ?? null);

  setStatusbarText(value: string | null): void {
    this._statusbarText.set(value);
  }

  setToolbarState(value: AppPixiStateEnum): void {
    this._toolbarState.set(value);
  }

  zoomEvent(zoom: ZoomEnum): void {
    this.zoomState.next(zoom);
  }

  removeObject(layerGuid: string, objectGuid: string): void {
    const layers = this._layers();
    const layer = layers.find((layer: ISceneLayer) => layer.guid === layerGuid);
    if (layer) {
      layer.objects = layer.objects.filter((obj: SceneObjectType) => obj.guid !== objectGuid);
      this.updateScene({ layers });
    }
  }

  updateLayerObject(layerGuid: string, objectGuid: string, fields: Partial<SceneObjectType>): void {
    const layers = this._layers();
    const layer = layers.find((layer: ISceneLayer) => layer.guid === layerGuid);
    if (layer) {
      const idx = layer.objects.findIndex((o: SceneObjectType) => o.guid === objectGuid);
      if (idx !== -1) {
        layer.objects[idx] = { ...layer.objects[idx], ...fields };
        layer.objects = [...layer.objects];
        this.updateScene({ layers: [...layers] });
      }
    }
  }

  addObjectToLayer(layerGuid: string, fields: SceneObjectType): void {
    const layers = this._layers();
    const layer = layers.find((layer: ISceneLayer) => layer.guid === layerGuid);
    if (layer) {
      layer.objects.push(fields);
      this.updateScene({ layers });
      this._currentLayer.set(layer);
      this._currentObject.set(fields);
    }
  }

  setCurrentByGuid(layerGuid: string, objectGuid: string | null = null): void {
    const layer = this._layers().find((layer: ISceneLayer) => layer.guid === layerGuid);
    if (layer) {
      if (!objectGuid) {
        this.setCurrent(layer);
      } else {
        const object = layer.objects.find((obj: SceneObjectType) => obj.guid === objectGuid);
        if (object) {
          this.setCurrent(layer, object);
        }
      }
    }
  }

  setCurrent(layer: ISceneLayer | null, object: SceneObjectType | null = null): void {
    this._currentLayer.set(layer);
    this._currentObject.set(object);
  }

  removeLayer(layerGuid: string): void {
    const layers = this._layers().filter((layer: ISceneLayer) => layer.guid !== layerGuid);
    this.updateScene({ layers });
    if (this._currentLayer()?.guid === layerGuid) {
      this._currentLayer.set(null);
    }
  }

  updateLayer(layerGuid: string, fields: Partial<ISceneLayer>): void {
    const layers = this._layers().map((layer: ISceneLayer) =>
      layer.guid === layerGuid ? { ...layer, ...fields } : layer,
    );
    this.updateScene({ layers });
  }

  addLayer(type: SceneLayerTypeEnum, name: string, properties: PropertiesType = {}, referenceGridId?: number): void {
    const layers = this._layers() ?? [];
    const fields = {
      guid: SUStringHelper.uuidv4(),
      type,
      name,
      x: 0,
      y: 0,
      zIndex: [SceneLayerTypeEnum.Events, SceneLayerTypeEnum.Grounds].includes(type) ? 100 : 0,
      visible: true,
      referenceGridId,
      properties,
      objects: [],
    };
    layers.push(fields);
    this.setCurrent(fields);
    this.updateScene({ layers });
  }

  updateScene(params: Partial<IScene>): void {
    const scene = this._scene();
    if (scene) {
      this._scene.set({ ...scene, ...params });
      if (params.layers !== undefined) {
        this._layers.set([...(this._scene()?.layers ?? [])]);
        if (this._currentLayer()) {
          const layer = this._layers().find((layer: ISceneLayer) => layer.guid === this._currentLayer()?.guid);
          this._currentLayer.set(layer ?? null);
          if (this._currentObject()) {
            const layer = this._layers().find((layer: ISceneLayer) => layer.guid === this._currentLayer()?.guid);
            const object = (layer?.objects || []).find(
              (obj: SceneObjectType) => obj.guid === this._currentObject()?.guid,
            );
            this._currentObject.set(object ?? null);
          }
        }
      }
      this._hasChanged.set(true);
    }
  }

  setScene(scene: IScene): void {
    this._scene.set(scene);
    this._layers.set(scene.layers);
    this._hasChanged.set(false);
  }

  setHasChanged(hasChanged: boolean): void {
    this._hasChanged.set(hasChanged);
  }

  reset(): void {
    this._scene.set(null);
    this._layers.set([]);
    this._currentLayer.set(null);
    this._currentObject.set(null);
    this._hasChanged.set(false);
    this._toolbarState.set(AppPixiStateEnum.Move);
    this._statusbarText.set(null);
  }
}
