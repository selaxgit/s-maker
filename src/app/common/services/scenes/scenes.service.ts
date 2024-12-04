import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { IProperties, IScene, ISceneObject, SceneObjectType } from '../../interfaces';
import { ScenesDBService } from './scenes.db.service';
import { ScenesObjectsDBService } from './scenes-objects.db.service';

export interface IAddSceneObjectPayload {
  projectId: number;
  sceneId: number;
  type: SceneObjectType;
  name: string;
  referenceId: number | null;
  parentId: number | null;
  properties: IProperties | null;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
}

@Injectable({ providedIn: 'root' })
export class ScenesService {
  constructor(
    private readonly scenesDBService: ScenesDBService,
    private readonly scenesObjectsDBService: ScenesObjectsDBService,
  ) {}

  public getSceneObjectTreeList(sceneId: number): Observable<ISceneObject[]> {
    return this.getSceneObjectTreeListByFilter((obj: ISceneObject) => obj.sceneId === sceneId);
  }

  public getSceneObjectTreeListByFilter(filter: (item: ISceneObject) => boolean): Observable<ISceneObject[]> {
    return this.scenesObjectsDBService.getListByFilter(filter).pipe(
      map((response: ISceneObject[]) => {
        return response
          .filter((obj: ISceneObject) => !obj.parentId)
          .map((obj: ISceneObject) => ({
            ...obj,
            children: response.filter((i: ISceneObject) => i.parentId === obj.id),
          }));
      }),
    );
  }

  public removeSceneObject(id: number): Observable<void> {
    return this.scenesObjectsDBService.removeObject(id);
  }

  public updateSceneObject(id: number, fields: Partial<ISceneObject>): Observable<ISceneObject> {
    return this.scenesObjectsDBService.update(id, fields);
  }

  public addSceneObject(payload: Partial<IAddSceneObjectPayload>): Observable<ISceneObject> {
    const fields = Object.assign(
      {
        referenceId: null,
        animationId: null,
        children: [],
        x: 0,
        y: 0,
        zIndex: 0,
        visible: true,
        properties: null,
        width: null,
        height: null,
      },
      payload,
    );
    return this.scenesObjectsDBService.insert(fields);
  }

  public getScene(id: number): Observable<IScene> {
    return this.scenesDBService.get(id);
  }

  public removeScene(id: number): Observable<void> {
    return this.scenesDBService.remove(id);
  }

  public updateScene(sceneId: number, fields: Partial<IScene>): Observable<IScene> {
    return this.scenesDBService.update(sceneId, fields);
  }

  public addScene(projectId: number, name: string): Observable<IScene> {
    return this.scenesDBService.insert({ projectId, name });
  }

  public fetchScenesObjectsByFilter(filter: (item: ISceneObject) => boolean): Observable<ISceneObject[]> {
    return this.scenesObjectsDBService.getListByFilter(filter);
  }

  public fetchScenes(projectId: number): Observable<IScene[]> {
    return this.scenesDBService.getListByFilter((item: IScene) => item.projectId === projectId);
  }
}
