import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap, tap, throwError } from 'rxjs';

import { ITilesGrid } from '~core/interfaces';
import { TilesGridRepository } from '~core/repositories';
import { ProjectStore } from '~core/stores';
import { EditGridStore } from '~core/stores/edit-grid.store';

@Injectable({
  providedIn: 'root',
})
export class GridFacade {
  private readonly tilesGridRepository = inject(TilesGridRepository);

  private readonly projectStore = inject(ProjectStore);

  private readonly editGridStore = inject(EditGridStore);

  initNewGrid(): void {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      throw new Error('Project ID не усановлен для создания сетки');
    }
    this.editGridStore.setGrid({
      id: -1,
      projectId,
      name: 'Новая сетка',
      tileInfo: { width: 32, height: 32 },
      mapInfo: { width: 10, height: 10 },
      background: {
        opacity: 0.5,
        file: null,
      },
      items: [],
    });
    this.editGridStore.setHasChanged(true);
  }

  removeGrid(id: number): Observable<void> {
    return this.tilesGridRepository.removeGrid(id);
  }

  saveGrid(): Observable<ITilesGrid> {
    const grid = this.editGridStore.grid();
    if (!grid) {
      return throwError(() => new Error('Нет сетки для сохранения'));
    }

    return this.tilesGridRepository.saveGrid(grid).pipe(
      switchMap((grid: ITilesGrid) => this.fetchGridList(grid.projectId).pipe(map(() => grid))),
      tap((grid: ITilesGrid) => {
        this.editGridStore.setGrid(grid);
      }),
    );
  }

  fetchGrid(id: number): Observable<ITilesGrid> {
    return this.tilesGridRepository.fetchGridById(id).pipe(
      tap((grid: ITilesGrid) => {
        this.editGridStore.setGrid(grid);
      }),
    );
  }

  fetchGridList(projectId: number): Observable<ITilesGrid[]> {
    return this.tilesGridRepository.fetchGridList(projectId);
  }

  resetEditGrid(): void {
    this.editGridStore.reset();
  }

  reset(): void {
    this.tilesGridRepository.reset();
    this.resetEditGrid();
  }
}
