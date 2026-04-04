import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import { DBProjects } from '~core/db';
import { IProject } from '~core/interfaces';
import { ProjectsListStore } from '~core/stores';

@Injectable({
  providedIn: 'root',
})
export class ProjectsListRepository {
  private readonly destroyRef = inject(DestroyRef);

  private readonly projectsListStore = inject(ProjectsListStore);

  private readonly dbProjects = inject(DBProjects);

  removeProject(id: number): Observable<void> {
    return this.dbProjects.remove(id);
  }

  addProject(name: string): Observable<IProject> {
    return this.dbProjects.insert({ name });
  }

  fetchProjectsList(force: boolean = false): void {
    if (this.projectsListStore.projectsList() !== null && !force) {
      return;
    }
    this.projectsListStore.setLoadingState(true);
    this.dbProjects
      .getList()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projectsList: IProject[]) => {
          this.projectsListStore.setProjectsList(projectsList);
        },
        error: () => {
          this.projectsListStore.setProjectsList([]);
        },
        complete: () => {
          this.projectsListStore.setLoadingState(false);
        },
      });
  }
}
