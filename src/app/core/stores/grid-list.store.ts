import { Injectable, signal } from '@angular/core';

import { ITilesGrid } from '~core/interfaces';

@Injectable({
  providedIn: 'root',
})
export class GridListStore {
  private readonly _gridList = signal<ITilesGrid[] | null>(null);

  readonly gridList = this._gridList.asReadonly();

  setGridList(gridList: ITilesGrid[]): void {
    this._gridList.set(gridList);
  }

  removeGrid(id: number): void {
    const currentList = this._gridList();
    if (currentList) {
      this._gridList.set(currentList.filter((grid: ITilesGrid) => grid.id !== id));
    }
  }

  reset(): void {
    this._gridList.set(null);
  }
}
