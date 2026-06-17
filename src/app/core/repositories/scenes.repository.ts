import { inject, Injectable } from '@angular/core';
import { SUJsonHelper } from '@selax/utils';
import { Observable, of, switchMap, tap, throwError } from 'rxjs';

import { DBScenes } from '~core/db';
import { IScene } from '~core/interfaces';
import { ProjectStore, ScenesListStore } from '~core/stores';

@Injectable({
  providedIn: 'root',
})
export class ScenesRepository {
  private readonly projectStore = inject(ProjectStore);

  private readonly scenesListStore = inject(ScenesListStore);

  private readonly dbScenes = inject(DBScenes);

  removeScene(id: number): Observable<void> {
    return this.dbScenes.remove(id).pipe(
      tap(() => {
        this.scenesListStore.removeScene(id);
      }),
    );
  }

  saveScene(scene: IScene): Observable<IScene> {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      return throwError(() => new Error('Project ID не установлен для сохранения сцены'));
    }
    const fields = SUJsonHelper.clone(scene);
    fields.projectId = projectId;
    let method;
    if (fields.id < 0) {
      delete fields.id;
      method = this.dbScenes.insert(fields);
    } else {
      method = this.dbScenes.update(fields.id, fields);
    }
    return method;
  }

  fetchSceneById(id: number): Observable<IScene> {
    return this.dbScenes.get(id).pipe(
      switchMap((scene: IScene | null) => {
        if (!scene) {
          return throwError(() => new Error(`Сцена не найдена по id: ${id}`));
        }
        return of(scene);
      }),
    );
  }

  fetchScenesList(projectId: number): Observable<IScene[]> {
    return this.dbScenes
      .getListByFilter((item: IScene) => item.projectId == projectId)
      .pipe(
        tap({
          next: (scenesList: IScene[]) => {
            this.scenesListStore.setScenesList(scenesList);
          },
          error: () => {
            this.scenesListStore.setScenesList([]);
          },
        }),
      );
  }

  reset(): void {
    this.scenesListStore.setScenesList([]);
  }
}
