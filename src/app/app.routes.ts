/* eslint-disable @typescript-eslint/typedef */
import { Routes } from '@angular/router';

import { SMCPageNotFoundComponent } from './common/components';
import { SMModeCodesEnum } from './common/interfaces';
import { ProjectPageComponent } from './core/pages/project-page';
import { ProjectsListPageComponent } from './core/pages/projects-list-page';

export const routes: Routes = [
  {
    path: '',
    component: ProjectsListPageComponent,
  },
  {
    path: ':pid',
    component: ProjectPageComponent,
  },
  {
    path: `:pid/${SMModeCodesEnum.framesCollection}`,
    loadComponent: () => import('./modules/frames-collection/home/home.component').then((mod) => mod.FCHomeComponent),
  },
  {
    path: `:pid/${SMModeCodesEnum.spriteCollection}`,
    loadComponent: () => import('./modules/sprites-collection/home/home.component').then((mod) => mod.SCHomeComponent),
  },

  {
    path: `:pid/${SMModeCodesEnum.spriteCollection}/:id`,
    loadComponent: () =>
      import('./modules/sprites-collection/sprite-edit/sprite-edit.component').then((mod) => mod.SCSpriteEditComponent),
  },
  {
    path: `:pid/${SMModeCodesEnum.tilesGridEditor}`,
    loadComponent: () => import('./modules/tiles-grid-editor/home/home.component').then((mod) => mod.TGEHomeComponent),
  },
  {
    path: `:pid/${SMModeCodesEnum.tilesGridEditor}/:id`,
    loadComponent: () => import('./modules/tiles-grid-editor/edit/edit.component').then((mod) => mod.TGEEditComponent),
  },
  {
    path: `:pid/${SMModeCodesEnum.sceneBuilder}`,
    loadComponent: () => import('./modules/scene-builder/home/home.component').then((mod) => mod.SBHomeComponent),
  },
  {
    path: `:pid/${SMModeCodesEnum.sceneBuilder}/:id`,
    loadComponent: () => import('./modules/scene-builder/edit/edit.component').then((mod) => mod.SBEditComponent),
  },
  {
    path: `:pid/${SMModeCodesEnum.landscapeGenerator}`,
    loadComponent: () =>
      import('./modules/landscape-generator/generator/generator.component').then((mod) => mod.LGGeneratorComponent),
  },
  {
    path: '**',
    component: SMCPageNotFoundComponent,
  },
];
