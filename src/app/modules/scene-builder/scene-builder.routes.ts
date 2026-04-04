/* eslint-disable @typescript-eslint/typedef */
import { Routes } from '@angular/router';

import { ExitSaveSceneGuard } from './guards';

export const SCENE_BUILDER_ROUTES: Routes = [
  {
    path: ':pid/scene-builder/:id',
    canDeactivate: [ExitSaveSceneGuard],
    loadComponent: () => import('./pages/home-page/home-page').then((m) => m.SBHomePage),
  },
];
