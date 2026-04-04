import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap, tap, throwError } from 'rxjs';

import { DBGrid } from '~core/db';
import { ITilesGrid } from '~core/interfaces';
import { ProjectStore } from '~core/stores';
import { GridListStore } from '~core/stores/grid-list.store';

@Injectable({
  providedIn: 'root',
})
export class TilesGridRepository {
  private readonly projectStore = inject(ProjectStore);

  private readonly gridListStore = inject(GridListStore);

  private readonly dbGrid = inject(DBGrid);

  removeGrid(id: number): Observable<void> {
    return this.dbGrid.remove(id).pipe(
      tap(() => {
        this.gridListStore.removeGrid(id);
      }),
    );
  }

  saveGrid(grid: ITilesGrid): Observable<ITilesGrid> {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      return throwError(() => new Error('Project ID не установлен для сохранения сетки'));
    }
    // Без any не работает delete fields.id, а клонировать json нельзя из-за File в background.file
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields: any = { ...grid };
    fields.projectId = projectId;
    let method;
    if (fields.id < 0) {
      delete fields.id;
      method = this.dbGrid.insert(fields);
    } else {
      method = this.dbGrid.update(fields.id, fields);
    }
    return method;
  }

  fetchGridById(id: number): Observable<ITilesGrid> {
    return this.dbGrid.get(id).pipe(
      switchMap((grid: ITilesGrid | null) => {
        if (!grid) {
          return throwError(() => new Error(`Сетка не найдена по id: ${id}`));
        }
        return of(grid);
      }),
    );
  }

  fetchGridList(projectId: number): Observable<ITilesGrid[]> {
    return this.dbGrid
      .getListByFilter((item: ITilesGrid) => item.projectId == projectId)
      .pipe(
        tap({
          next: (gridList: ITilesGrid[]) => {
            this.gridListStore.setGridList(gridList);
          },
          error: () => {
            this.gridListStore.setGridList([]);
          },
        }),
      );
  }

  reset(): void {
    this.gridListStore.setGridList([]);
  }
}
