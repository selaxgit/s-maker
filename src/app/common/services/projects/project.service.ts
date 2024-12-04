import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import { IProject } from '../../interfaces';
import { ProjectsDBService } from './projects.db.service';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  constructor(private readonly projectsDBService: ProjectsDBService) {}

  public add(name: string): Observable<IProject> {
    return this.projectsDBService.insert({ name });
  }

  public update(id: number, project: Partial<IProject>): Observable<IProject> {
    return this.projectsDBService.update(id, project).pipe(switchMap(() => this.get(id)));
  }

  public get(id: number): Observable<IProject> {
    return this.projectsDBService.get(id);
  }

  public getList(): Observable<IProject[]> {
    return this.projectsDBService.getList();
  }

  public remove(id: number): Observable<void> {
    return this.projectsDBService.remove(id);
  }
}
