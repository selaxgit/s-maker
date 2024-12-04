import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import markdownit from 'markdown-it';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-about',
    imports: [MatProgressSpinnerModule],
    templateUrl: './about.component.html',
    styleUrl: './about.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent implements OnInit {
  dialogRef!: MatDialogRef<AboutComponent>;

  loadingState: WritableSignal<boolean> = signal(true);

  version = 'Unknown';

  infoHtml = '';

  constructor(private readonly httpClient: HttpClient) {}

  ngOnInit(): void {
    this.httpClient
      .get(`assets/CHANGELOG.md`, {
        responseType: 'text',
      })
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe((info: string) => {
        const md = markdownit();
        this.infoHtml = md.render(info);
      });
  }

  setData(data: { version: string }): void {
    this.version = data.version ?? 'Unknown';
  }
}
