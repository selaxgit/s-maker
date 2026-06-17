/* eslint-disable @typescript-eslint/typedef */
import { Routes } from '@angular/router';

export const TILES_GRID_EDITOR_ROUTES: Routes = [
  {
    path: ':pid/tiles-grid-editor/:id',
    loadComponent: () => import('./pages/home-page/home-page').then((m) => m.TGEHomePage),
  },
];
