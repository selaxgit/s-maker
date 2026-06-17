import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbsStore {
  private readonly _projectId = signal<number | null>(null);

  private readonly _projectName = signal<string | null>(null);

  private readonly _moduleRouter = signal<string | null>(null);

  private readonly _moduleName = signal<string | null>(null);

  private readonly _pageName = signal<string | null>(null);

  readonly projectId = this._projectId.asReadonly();

  readonly projectName = this._projectName.asReadonly();

  readonly moduleRouter = this._moduleRouter.asReadonly();

  readonly moduleName = this._moduleName.asReadonly();

  readonly pageName = this._pageName.asReadonly();

  reset(): void {
    this.resetProject();
    this.resetModule();
    this.resetPage();
  }

  resetProject(): void {
    this._projectId.set(null);
    this._projectName.set(null);
  }

  resetModule(): void {
    this._moduleName.set(null);
    this._moduleRouter.set(null);
    this._pageName.set(null);
  }

  resetPage(): void {
    this._pageName.set(null);
  }

  setProject(projectId: number, projectName: string): void {
    this._projectId.set(projectId);
    this._projectName.set(projectName);
  }

  setModule(moduleName: string, moduleRouter: string | null = null): void {
    this._moduleName.set(moduleName);
    this._moduleRouter.set(moduleRouter);
  }

  setPage(pageName: string | null): void {
    this._pageName.set(pageName);
  }
}
