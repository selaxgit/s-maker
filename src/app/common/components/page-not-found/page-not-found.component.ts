import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { APP_TITLE } from '../../constants';

@Component({
  selector: 'smc-page-not-found',
  standalone: true,
  template: ` <img src="assets/404.png" (click)="onGoHome()" />`,
  styles: [
    `
      :host {
        flex: auto;
        display: flex;
        flex-direction: column;
        height: 100%;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SMCPageNotFoundComponent {
  @Input() goHomeOnClick = true;

  constructor(
    private readonly titleService: Title,
    private readonly router: Router,
  ) {
    this.titleService.setTitle(`404 | ${APP_TITLE}`);
  }

  onGoHome(): void {
    if (this.goHomeOnClick) {
      this.router.navigate(['/']);
    }
  }
}
