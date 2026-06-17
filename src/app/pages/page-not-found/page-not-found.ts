import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { SMCHeaderComponent } from '~components/header';
import { APP_TITLE } from '~constants/base.constants';

@Component({
  selector: 'page-not-found',
  imports: [SMCHeaderComponent],
  templateUrl: './page-not-found.html',
  styleUrls: ['./page-not-found.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageNotFound {
  readonly goHomeOnClick = input<boolean>(true);

  private readonly titleService = inject(Title);

  private readonly router = inject(Router);

  constructor() {
    this.titleService.setTitle(`404 | ${APP_TITLE}`);
  }

  onGoHome(): void {
    if (this.goHomeOnClick()) {
      this.router.navigate(['/']);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onGoHome();
    }
  }
}
