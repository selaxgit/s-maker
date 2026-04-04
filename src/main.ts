import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig).catch((err: unknown) => {
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error('An unknown error occurred');
  }
});
