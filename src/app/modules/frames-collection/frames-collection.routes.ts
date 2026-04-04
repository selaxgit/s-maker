/* eslint-disable @typescript-eslint/typedef */
import { Routes } from '@angular/router';

export const FRAMES_COLLECTION_ROUTES: Routes = [
  {
    path: ':pid/frames-collection',
    loadComponent: () => import('./pages/home-page/home-page').then((m) => m.FCHomePagePage),
  },
];
