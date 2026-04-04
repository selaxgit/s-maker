import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { DBProjects } from '~core/db';
import { IProject } from '~core/interfaces';
import { ProjectStore } from '~core/stores';

@Injectable({
  providedIn: 'root',
})
export class ProjectRepository {
  private readonly projectStore = inject(ProjectStore);

  private readonly dbProjects = inject(DBProjects);

  updateProject(projectId: number, name: string): Observable<IProject> {
    return this.dbProjects.update(projectId, { name });
  }

  fetchProject(projectId: number): Observable<IProject | null> {
    if (this.projectStore.hasProject(projectId)) {
      return of(this.projectStore.project());
    }
    return this.dbProjects.get(projectId);
  }

  getProject(projectId: number): IProject | null {
    return this.projectStore.hasProject(projectId) ? this.projectStore.project() : null;
  }

  reset(): void {
    this.projectStore.reset();
  }
}
