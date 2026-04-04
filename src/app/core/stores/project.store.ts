import { computed, Injectable, signal } from '@angular/core';

import { IProject } from '~core/interfaces';

@Injectable({
  providedIn: 'root',
})
export class ProjectStore {
  private readonly _project = signal<IProject | null>(null);

  private readonly _loadingState = signal<boolean>(true);

  readonly project = this._project.asReadonly();

  readonly loadingState = this._loadingState.asReadonly();

  readonly projectId = computed(() => this._project()?.id ?? null);

  readonly projectName = computed(() => this._project()?.name ?? '');

  setLoadingState(loadingState: boolean): void {
    this._loadingState.set(loadingState);
  }

  setProject(project: IProject): void {
    this._project.set(project);
    this._loadingState.set(false);
  }

  reset(): void {
    this._project.set(null);
    this._loadingState.set(true);
  }

  hasProject(projectId: number): boolean {
    return this._project() !== null && this._project()!.id === projectId;
  }
}
