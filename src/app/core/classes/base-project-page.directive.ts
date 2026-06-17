import { DestroyRef, Directive, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { ProjectFacade } from '~core/facade';
import { IProject } from '~core/interfaces';
import { BreadcrumbsStore, ProjectStore } from '~core/stores';

@Directive()
export abstract class BaseProjectPageDirective implements OnInit {
  private readonly _is404Page = signal(false);

  readonly is404Page = this._is404Page.asReadonly();

  protected readonly activatedRoute = inject(ActivatedRoute);

  protected readonly router = inject(Router);

  protected readonly titleService = inject(Title);

  protected readonly destroyRef = inject(DestroyRef);

  protected readonly breadcrumbsStore = inject(BreadcrumbsStore);

  protected readonly projectStore = inject(ProjectStore);

  protected readonly projectFacade = inject(ProjectFacade);

  ngOnInit(): void {
    this.activatedRoute.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params: ParamMap) => {
      this.loadProject(params);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected changeActivatedRoute(_params: ParamMap): void {}

  protected setIs404Page(value: boolean): void {
    this._is404Page.set(value);
  }

  private loadProject(params: ParamMap): void {
    const projectId = params.get('pid');
    if (this.projectFacade.hasProject(+projectId!)) {
      this.changeActivatedRoute(params);
      return;
    }
    this.projectFacade.projectReset();
    if (projectId && !isNaN(+projectId) && +projectId > 0) {
      this.projectFacade
        .fetchProject(+projectId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (project: IProject | null) => {
            if (!project) {
              this._is404Page.set(true);
            } else {
              this._is404Page.set(false);
              this.changeActivatedRoute(params);
            }
          },
          error: () => {
            this._is404Page.set(true);
          },
        });
    } else {
      this._is404Page.set(true);
    }
  }
}
