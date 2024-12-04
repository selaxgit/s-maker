import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  BehaviorSubject,
  finalize,
  forkJoin,
  from,
  lastValueFrom,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { CanvasHelper } from '../common/helpers';
import {
  EditorToolStateType,
  ICoords,
  IFrame,
  IRect,
  IScene,
  ISceneObject,
  IStoreKeyCanvas,
  ZoomType,
} from '../common/interfaces';
import { FramesService } from '../common/services/frames';
import { IAddSceneObjectPayload, ScenesService } from '../common/services/scenes';
import { TilesGridService } from '../common/services/tiles';

interface ScenesState {
  scenesList: IScene[];
  currentScene: IScene | null;
  editorCurrentSceneObject: ISceneObject | null;
  editorSceneObjects: ISceneObject[];
  spritesStore: IStoreKeyCanvas;
  framesStore: IStoreKeyCanvas | null;
}

const initialState: ScenesState = {
  scenesList: [],
  currentScene: null,
  editorCurrentSceneObject: null,
  editorSceneObjects: [],
  spritesStore: {},
  framesStore: null,
};

@Injectable({ providedIn: 'root' })
export class ScenesStore extends ComponentStore<ScenesState> {
  readonly scenesList$ = this.select((state: ScenesState) => state.scenesList);

  readonly currentScene$ = this.select((state: ScenesState) => state.currentScene);

  readonly editorCurrentSceneObject$ = this.select((state: ScenesState) => state.editorCurrentSceneObject);

  readonly editorSceneObjects$ = this.select((state: ScenesState) => state.editorSceneObjects);

  readonly spritesStore$ = this.select((state: ScenesState) => state.spritesStore);

  readonly framesStore$ = this.select((state: ScenesState) => state.framesStore);

  private editorZoomEvent = new Subject<ZoomType>();

  readonly editorZoomEvent$ = this.editorZoomEvent.asObservable();

  private isLoading = new Subject<boolean>();

  readonly isLoading$ = this.isLoading.asObservable();

  private editorCoordsEvent = new Subject<ICoords | null>();

  readonly editorCoordsEvent$ = this.editorCoordsEvent.asObservable();

  private editorToolState = new BehaviorSubject<EditorToolStateType>('move');

  readonly editorToolState$ = this.editorToolState.asObservable();

  private expandObjectEvent = new Subject<number>();

  readonly expandObjectEvent$ = this.expandObjectEvent.asObservable();

  private drawContainerRect = new BehaviorSubject<IRect>({ x: 0, y: 0, width: 0, height: 0 });

  readonly drawContainerRect$ = this.drawContainerRect.asObservable();

  constructor(
    private readonly scenesService: ScenesService,
    private readonly tilesGridService: TilesGridService,
    private readonly framesService: FramesService,
  ) {
    super(initialState);
  }

  public sendDrawContainerRect(rect: IRect): void {
    this.drawContainerRect.next(rect);
  }

  public selectObjectById(objectId: number): void {
    const objects = this.get().editorSceneObjects || [];
    for (const obj of objects) {
      if (obj.id === objectId) {
        this.patchState({ editorCurrentSceneObject: obj });
        return;
      }
      for (const child of obj.children) {
        if (child.id === objectId) {
          this.patchState({ editorCurrentSceneObject: child });
          this.expandObjectEvent.next(obj.id);
          return;
        }
      }
    }
  }

  public fetchSceneObjects(sceneId: number): void {
    this.scenesService
      .getSceneObjectTreeList(sceneId)
      .pipe(
        switchMap((sceneObject: ISceneObject[]) => {
          return from(this.fetchStores(sceneObject)).pipe(switchMap(() => of(sceneObject)));
        }),
      )
      .subscribe((sceneObject: ISceneObject[]) => {
        this.patchState({ editorSceneObjects: sceneObject });
      });
  }

  public removeSceneObject(sceneId: number, id: number): void {
    if (this.get().editorCurrentSceneObject?.id === id) {
      this.patchState({ editorCurrentSceneObject: null });
    }
    this.scenesService.removeSceneObject(id).subscribe(() => {
      this.fetchSceneObjects(sceneId);
    });
  }

  public updateSceneObject(sceneId: number | null, id: number, fields: Partial<ISceneObject>): void {
    if (!sceneId) {
      sceneId = this.get().currentScene?.id ?? null;
    }
    this.scenesService.updateSceneObject(id, fields).subscribe((sceneObject: ISceneObject) => {
      if (sceneId) {
        this.fetchSceneObjects(sceneId);
        if (this.get().editorCurrentSceneObject?.id === id) {
          this.patchState({ editorCurrentSceneObject: sceneObject });
        }
      }
    });
  }

  public addMultiSceneObjects(sceneId: number, payload: Partial<IAddSceneObjectPayload>[]): void {
    const forks: Observable<ISceneObject>[] = [];
    payload.forEach((fields: Partial<IAddSceneObjectPayload>) => forks.push(this.scenesService.addSceneObject(fields)));
    forkJoin(forks).subscribe(() => {
      this.fetchSceneObjects(sceneId);
    });
  }

  public addSceneObject(sceneId: number, payload: Partial<IAddSceneObjectPayload>): void {
    this.scenesService.addSceneObject(payload).subscribe((sceneObject: ISceneObject) => {
      this.patchState({ editorCurrentSceneObject: sceneObject });
      this.fetchSceneObjects(sceneId);
    });
  }

  public setSelectedSceneObject(obj: ISceneObject): void {
    this.patchState({ editorCurrentSceneObject: obj });
  }

  public sendEditorZoom(zoom: ZoomType): void {
    this.editorZoomEvent.next(zoom);
  }

  public sendEditorCoords(coords: ICoords | null): void {
    this.editorCoordsEvent.next(coords);
  }

  public setEditorToolState(state: EditorToolStateType): void {
    this.editorToolState.next(state);
  }

  public initializeScene(sceneId: number): void {
    this.isLoading.next(true);
    this.patchState({
      editorCurrentSceneObject: null,
      editorSceneObjects: [],
    });
    this.scenesService
      .getScene(sceneId)
      .pipe(finalize(() => this.isLoading.next(false)))
      .subscribe((scene: IScene) => {
        this.patchState({ currentScene: scene });
        this.fetchSceneObjects(scene.id);
      });
  }

  public removeScene(projectId: number, id: number): void {
    this.scenesService
      .removeScene(id)
      .pipe(tap(() => this.fetchScenes(projectId)))
      .subscribe();
  }

  public updateScene(sceneId: number, fields: Partial<IScene>): void {
    this.scenesService.updateScene(sceneId, fields).subscribe((scene: IScene) => {
      if (this.get().currentScene?.id === scene.id) {
        this.patchState({ currentScene: scene });
      }
      this.fetchScenes(scene.projectId);
    });
  }

  public addScene(projectId: number, name: string): Observable<IScene> {
    return this.scenesService.addScene(projectId, name).pipe(tap(() => this.fetchScenes(projectId)));
  }

  public fetchScenes(projectId: number): void {
    this.isLoading.next(true);
    this.scenesService
      .fetchScenes(projectId)
      .pipe(finalize(() => this.isLoading.next(false)))
      .subscribe((scenesList: IScene[]) => this.patchState({ scenesList }));
  }

  private async fetchStores(sceneObject: ISceneObject[]): Promise<void> {
    for (const obj of sceneObject) {
      switch (obj.type) {
        case 'layer-grid':
          await this.fetchStoreForLayerGrid(obj);
          break;
      }
    }
  }

  private async fetchStoreForLayerGrid(obj: ISceneObject): Promise<void> {
    if (!obj.referenceId) {
      return;
    }
    const store: IStoreKeyCanvas = {};
    const grid = await lastValueFrom(this.tilesGridService.getTileGrid(obj.referenceId));
    let itemsIds: number[] = [];
    for (const item of grid.items) {
      if (item.referenceId) {
        itemsIds.push(item.referenceId);
      }
    }
    itemsIds = [...new Set([...itemsIds])];
    if (itemsIds.length === 0) {
      return;
    }
    const tiles = await lastValueFrom(this.framesService.fetchTilesByFilter((i: IFrame) => itemsIds.includes(i.id)));
    for (const tile of tiles) {
      if (tile.file) {
        store[tile.id] = await CanvasHelper.fileToCanvas(tile.file);
      }
    }
    this.patchState({ framesStore: store });
  }
}
