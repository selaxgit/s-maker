import { Injectable, signal } from '@angular/core';

import { IScene } from '~core/interfaces';

@Injectable({
  providedIn: 'root',
})
export class ScenesListStore {
  private readonly _scenesList = signal<IScene[] | null>(null);

  readonly scenesList = this._scenesList.asReadonly();

  setScenesList(scenesList: IScene[]): void {
    this._scenesList.set(scenesList);
  }

  removeScene(id: number): void {
    const currentList = this._scenesList();
    if (currentList) {
      this._scenesList.set(currentList.filter((grid: IScene) => grid.id !== id));
    }
  }

  reset(): void {
    this._scenesList.set(null);
  }
}
