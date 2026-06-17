import { Injectable, signal } from '@angular/core';

import { IProject } from '~core/interfaces';

@Injectable({
  providedIn: 'root',
})
export class ProjectsListStore {
  private readonly _projectsList = signal<IProject[] | null>(null);

  private readonly _loadingState = signal<boolean>(true);

  readonly projectsList = this._projectsList.asReadonly();

  readonly loadingState = this._loadingState.asReadonly();

  setLoadingState(loadingState: boolean): void {
    this._loadingState.set(loadingState);
  }

  setProjectsList(projectsList: IProject[]): void {
    this._projectsList.set(projectsList);
    this._loadingState.set(false);
  }

  reset(): void {
    this._projectsList.set(null);
    this._loadingState.set(true);
  }
}
