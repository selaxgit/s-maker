import { Injectable } from '@angular/core';
import { ComponentStore, OnStoreInit } from '@ngrx/component-store';
import { BehaviorSubject, finalize, Observable, tap } from 'rxjs';

import { IProject } from '../common/interfaces';
import { ProjectsService } from '../common/services/projects';

interface ProjectsState {
  projects: IProject[];
}

const initialState: ProjectsState = {
  projects: [],
};

@Injectable({ providedIn: 'root' })
export class ProjectsStore extends ComponentStore<ProjectsState> implements OnStoreInit {
  private isLoading = new BehaviorSubject<boolean>(false);

  readonly isLoading$ = this.isLoading.asObservable();

  readonly projectsList$ = this.select((state: ProjectsState) => state.projects);

  constructor(private readonly projectsService: ProjectsService) {
    super(initialState);
  }

  public ngrxOnStoreInit(): void {
    this.isLoading.next(true);
    this.patchState({ projects: [] });
    this.projectsService
      .getList()
      .pipe(finalize(() => this.isLoading.next(false)))
      .subscribe((projects: IProject[]) => this.patchState({ projects }));
  }

  public removeProject(id: number): void {
    this.isLoading.next(true);
    this.projectsService
      .remove(id)
      .pipe(finalize(() => this.isLoading.next(false)))
      .subscribe(() => {
        const projects = this.get().projects;
        this.patchState({ projects: projects.filter((item: IProject) => item.id !== id) });
      });
  }

  public addProject(name: string): Observable<IProject> {
    this.isLoading.next(true);
    return this.projectsService.add(name).pipe(
      finalize(() => this.isLoading.next(false)),
      tap((project: IProject) => {
        const projects = this.get().projects;
        projects.push(project);
        this.patchState({ projects });
      }),
    );
  }
}
