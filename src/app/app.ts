import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Event, RouteConfigLoadEnd, RouteConfigLoadStart, Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatProgressBarModule],
  templateUrl: './app.html',
  styles: `
    :host {
      flex: auto;
      display: flex;
      flex-direction: column;
    }
    mat-progress-bar {
      position: absolute;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly loadingState = signal(false);

  private readonly router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event: Event) => {
      if (event instanceof RouteConfigLoadStart) {
        this.loadingState.set(true);
      } else if (event instanceof RouteConfigLoadEnd) {
        this.loadingState.set(false);
      }
    });
  }
}
