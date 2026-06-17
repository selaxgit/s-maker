import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideSelaxUtilsSettings } from '@selax/utils';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideSelaxUtilsSettings({
      dbParams: {
        dbVersion: 1,
        dbName: 's-maker-db-v5',
        dbTables: ['projects', 'frames-tree', 'frames', 'sprites-tree', 'sprites', 'tiles-grid', 'scenes'],
      },
    }),
  ],
};
