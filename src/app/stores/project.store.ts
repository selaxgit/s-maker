import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { BehaviorSubject, finalize } from 'rxjs';

import { NumberHelper } from '../common/helpers';
import { IProject } from '../common/interfaces';
import { ProjectsService } from '../common/services/projects';
import { ScenesStore } from './scenes.store';
import { TilesGridStore } from './tiles-grid.store';

interface ProjectState {
  project: IProject | null;
}

const initialState: ProjectState = {
  project: null,
};

@Injectable()
export class ProjectStore extends ComponentStore<ProjectState> {
  private isInitializing = new BehaviorSubject<boolean>(true);

  readonly isInitializing$ = this.isInitializing.asObservable();

  readonly project$ = this.select((state: ProjectState) => state.project);

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tilesGridStore: TilesGridStore,
    private readonly scenesStore: ScenesStore,
  ) {
    super(initialState);
  }

  public updateProject(id: number, fields: Partial<IProject>): void {
    this.projectsService.update(id, fields).subscribe((project: IProject) => this.patchState({ project }));
  }

  public initialize(id: string | null): void {
    if (!NumberHelper.isNumber(id)) {
      this.isInitializing.next(false);
      this.patchState({ project: null });
      return;
    }
    if (this.get().project?.id === Number(id)) {
      this.isInitializing.next(false);
      return;
    }
    this.isInitializing.next(true);
    this.projectsService
      .get(Number(id))
      .pipe(finalize(() => this.isInitializing.next(false)))
      .subscribe((project: IProject) => {
        this.patchState({ project });
        this.tilesGridStore.fetchTilesGrids(project.id);
        this.scenesStore.fetchScenes(project.id);
      });
  }
}
