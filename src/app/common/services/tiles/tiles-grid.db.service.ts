import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import { DBBase } from '../../classes';
import { ITilesGrid } from '../../interfaces';
import { TilesGridBgDBService } from './tiles-grid-bg.db.service';

@Injectable({ providedIn: 'root' })
export class TilesGridDBService extends DBBase<ITilesGrid> {
  protected readonly tableName = 'tiles-grid';

  constructor(private readonly tilesGridBgDBService: TilesGridBgDBService) {
    super();
  }

  public override remove(id: number): Observable<void> {
    return this.tilesGridBgDBService
      .removeByFilter((item: { gridId: number }) => item.gridId === id)
      .pipe(switchMap(() => super.remove(id)));
  }
}
