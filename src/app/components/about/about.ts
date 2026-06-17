import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import markdownit from 'markdown-it';
import { finalize } from 'rxjs';

import * as pkg from '../../../../package.json';

@Component({
  imports: [MatProgressSpinnerModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SMCAbout implements OnInit {
  readonly version: string = '???';

  dialogRef!: MatDialogRef<SMCAbout>;

  loadingState = signal<boolean>(true);

  infoHtml = '';

  private readonly httpClient = inject(HttpClient);

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.version = pkg.version;
  }

  ngOnInit(): void {
    this.httpClient
      .get(`assets/CHANGELOG.md`, {
        responseType: 'text',
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingState.set(false)),
      )
      .subscribe((info: string) => {
        const md = markdownit();
        this.infoHtml = md.render(info);
      });
  }
}
