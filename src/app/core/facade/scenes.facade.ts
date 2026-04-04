import { inject, Injectable } from '@angular/core';
import { SUStringHelper } from '@selax/utils';
import { lastValueFrom, map, Observable, switchMap, tap, throwError } from 'rxjs';

import { IScene, ISpriteAnimation } from '~core/interfaces';
import { ScenesRepository } from '~core/repositories';
import { EditSceneStore, ProjectStore } from '~core/stores';

import { SpritesFacade } from './sprites.facade';

@Injectable({
  providedIn: 'root',
})
export class ScenesFacade {
  private readonly scenesRepository = inject(ScenesRepository);

  private readonly projectStore = inject(ProjectStore);

  private readonly editSceneStore = inject(EditSceneStore);

  private readonly spritesFacade = inject(SpritesFacade);

  async addObjectSpriteToLayer(layerGuid: string, spriteId: number): Promise<void> {
    const sprite = await lastValueFrom(this.spritesFacade.fetchSpriteById(spriteId));
    if (!sprite) {
      throw new Error('Ненайден спрайт для добавления слоя');
    }
    const animationGuid = sprite?.animations?.find((item: ISpriteAnimation) => item.default)?.guid ?? null;
    this.editSceneStore.addObjectToLayer(layerGuid, {
      guid: SUStringHelper.uuidv4(),
      name: sprite.name,
      referenceId: spriteId,
      x: 0,
      y: 0,
      visible: true,
      properties: {},
      zIndex: 0,
      animationGuid,
      playing: false,
    });
  }

  removeScene(id: number): Observable<void> {
    return this.scenesRepository.removeScene(id);
  }

  saveScene(): Observable<IScene> {
    const scene = this.editSceneStore.scene();
    if (!scene) {
      return throwError(() => new Error('Нет сцены для сохранения'));
    }
    return this.scenesRepository.saveScene(scene).pipe(
      switchMap((scene: IScene) => this.fetchScenesList(scene.projectId).pipe(map(() => scene))),
      tap((scene: IScene) => {
        this.editSceneStore.setScene(scene);
        this.spritesFacade.updateUsedFrames();
      }),
    );
  }

  initNewScene(): void {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      throw new Error('Project ID не установлен для новой сцены');
    }
    this.editSceneStore.setScene({
      id: -1,
      projectId,
      name: 'Новая сцена',
      width: null,
      height: null,
      offsetX: null,
      offsetY: null,
      layers: [],
    });
    this.editSceneStore.setHasChanged(true);
  }

  hasChanged(): boolean {
    return this.editSceneStore.hasChanged();
  }

  fetchScene(id: number): Observable<IScene> {
    return this.scenesRepository.fetchSceneById(id).pipe(
      tap((scene: IScene) => {
        this.editSceneStore.setScene(scene);
      }),
    );
  }

  fetchScenesList(projectId: number): Observable<IScene[]> {
    return this.scenesRepository.fetchScenesList(projectId);
  }

  resetEditScene(): void {
    this.editSceneStore.reset();
  }

  reset(): void {
    this.scenesRepository.reset();
  }
}
