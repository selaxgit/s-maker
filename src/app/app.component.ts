import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterOutlet } from '@angular/router';
import { JSTDialogService } from '@jst/ui';
import { provideComponentStore } from '@ngrx/component-store';

import * as pkg from '../../package.json';
import { AboutComponent } from './core/components/about';
import { ProjectStore } from './stores';
@Component({
    imports: [CommonModule, RouterOutlet, RouterLink, MatButtonModule, MatIconModule],
    selector: 'app-root',
    styleUrl: './app.component.scss',
    templateUrl: './app.component.html',
    providers: [provideComponentStore(ProjectStore)],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  loadingState: WritableSignal<boolean> = signal(false);

  constructor(private readonly jstDialogService: JSTDialogService) {}

  onAbout(): void {
    this.jstDialogService.showModal('О программе', AboutComponent, { version: pkg.default.version });
  }
}
