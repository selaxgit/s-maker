import { Routes } from '@angular/router';

import { FRAMES_COLLECTION_ROUTES } from './modules/frames-collection/frames-collection.routes';
import { LANDSCAPE_GENERATOR_ROUTES } from './modules/landscape-generator/landscape-generator.routes';
import { PROJECTS_ROUTES } from './modules/projects/projects.routes';
import { SCENE_BUILDER_ROUTES } from './modules/scene-builder/scene-builder.routes';
import { SPRITES_COLLECTION_ROUTES } from './modules/sprites-collection/sprites-collection.routes';
import { TILES_GRID_EDITOR_ROUTES } from './modules/tiles-grid-editor/tiles-grid-editor.routes';
import { PageNotFound } from './pages/page-not-found';

export const routes: Routes = [
  ...PROJECTS_ROUTES,
  ...FRAMES_COLLECTION_ROUTES,
  ...SPRITES_COLLECTION_ROUTES,
  ...LANDSCAPE_GENERATOR_ROUTES,
  ...TILES_GRID_EDITOR_ROUTES,
  ...SCENE_BUILDER_ROUTES,
  {
    path: '**',
    component: PageNotFound,
  },
];
