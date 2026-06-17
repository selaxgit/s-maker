/* eslint-disable @typescript-eslint/typedef */
import { Routes } from '@angular/router';

import { ExitSaveSpriteGuard } from './guards';

export const SPRITES_COLLECTION_ROUTES: Routes = [
  {
    path: ':pid/sprites-collection',
    loadComponent: () => import('./pages/home-page/home-page').then((m) => m.SCHomePagePage),
  },
  {
    path: ':pid/sprites-collection/:id',
    canDeactivate: [ExitSaveSpriteGuard],
    loadComponent: () => import('./pages/edit-page/edit-page').then((m) => m.SCEditPage),
  },
];
