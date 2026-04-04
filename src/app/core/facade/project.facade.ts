import { inject, Injectable } from '@angular/core';
import { finalize, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';

import { IProject } from '~core/interfaces';
import { ProjectsListRepository } from '~core/repositories';
import { ProjectRepository } from '~core/repositories/project.repository';
import { BreadcrumbsStore, ProjectStore } from '~core/stores';

import { FramesFacade } from './frames.facade';
import { GridFacade } from './grid.facade';
import { ScenesFacade } from './scenes.facade';
import { SpritesFacade } from './sprites.facade';

@Injectable({
  providedIn: 'root',
})
export class ProjectFacade {
  private readonly projectRepository = inject(ProjectRepository);

  private readonly projectsListRepository = inject(ProjectsListRepository);

  private readonly breadcrumbsStore = inject(BreadcrumbsStore);

  private readonly projectStore = inject(ProjectStore);

  private readonly framesFacade = inject(FramesFacade);

  private readonly spritesFacade = inject(SpritesFacade);

  private readonly scenesFacade = inject(ScenesFacade);

  private readonly gridFacade = inject(GridFacade);

  updateProject(projectId: number, name: string): Observable<IProject> {
    return this.projectRepository.updateProject(projectId, name).pipe(
      tap((project: IProject) => {
        if (project) {
          this.updateStores(project);
          this.projectsListRepository.fetchProjectsList(true);
        }
      }),
    );
  }

  fetchProject(projectId: number): Observable<IProject | null> {
    const project = this.projectRepository.getProject(projectId);
    if (project) {
      this.breadcrumbsStore.setProject(project.id, project.name);
      return of(project);
    }
    this.projectReset();
    return this.projectRepository.fetchProject(projectId).pipe(
      switchMap((project: IProject | null) => {
        if (project) {
          this.updateStores(project);
          this.gridFacade.fetchGridList(project.id);
          return forkJoin({
            framesTree: this.framesFacade.fetchTree(project.id),
            frames: this.framesFacade.fetchFrames(project.id),
            spritesTree: this.spritesFacade.fetchTree(project.id),
            sprites: this.spritesFacade.fetchSprites(project.id),
            grids: this.gridFacade.fetchGridList(project.id),
            scenes: this.scenesFacade.fetchScenesList(project.id),
          }).pipe(map(() => project));
        }
        return of(null);
      }),
      finalize(() => this.projectStore.setLoadingState(false)),
    );
  }

  hasProject(projectId: number): boolean {
    return this.projectRepository.getProject(projectId) !== null;
  }

  projectReset(): void {
    this.scenesFacade.reset();
    this.spritesFacade.reset();
    this.framesFacade.reset();
    this.gridFacade.reset();
    this.projectRepository.reset();
    this.breadcrumbsStore.resetProject();
  }

  private updateStores(project: IProject): void {
    this.projectStore.setProject(project);
    this.breadcrumbsStore.setProject(project.id, project.name);
  }
}
