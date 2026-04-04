/* eslint-disable @typescript-eslint/typedef */
import { Routes } from '@angular/router';

export const LANDSCAPE_GENERATOR_ROUTES: Routes = [
  {
    path: ':pid/landscape-generator',
    loadComponent: () => import('./pages/home-page/home-page').then((m) => m.LGHomePage),
  },
];
