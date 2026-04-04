/* eslint-disable @typescript-eslint/typedef */
import { Routes } from '@angular/router';

export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/projects-list/projects-list').then((m) => m.ProjectsListPage),
  },
  {
    path: ':pid',
    loadComponent: () => import('./pages/project-home/project-home').then((m) => m.ProjectHomePage),
  },
];
