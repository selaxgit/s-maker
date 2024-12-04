import { Injectable } from '@angular/core';
import { lastValueFrom, Observable } from 'rxjs';

import { ITilesGrid, ITilesGridBg } from '../../interfaces';
import { TilesGridDBService } from './tiles-grid.db.service';
import { TilesGridBgDBService } from './tiles-grid-bg.db.service';

@Injectable({ providedIn: 'root' })
export class TilesGridService {
  constructor(
    private readonly tilesGridDBService: TilesGridDBService,
    private readonly tilesGridBgDBService: TilesGridBgDBService,
  ) {}

  public getTileGrid(id: number): Observable<ITilesGrid> {
    return this.tilesGridDBService.get(id);
  }

  public getTileGridBg(gridId: number): Observable<ITilesGridBg | null> {
    return this.tilesGridBgDBService.getByFilter((item: ITilesGridBg) => item.gridId === gridId);
  }

  public removeTileGrid(id: number): Observable<void> {
    return this.tilesGridDBService.remove(id);
  }

  public updateTileGrid(id: number, fields: Partial<ITilesGrid>): Observable<ITilesGrid> {
    return this.tilesGridDBService.update(id, fields);
  }

  public updateTileGridBg(id: number, fields: Partial<ITilesGridBg>): Observable<ITilesGridBg> {
    return this.tilesGridBgDBService.update(id, fields);
  }

  public addTileGrid(fields: Partial<ITilesGrid>): Observable<ITilesGrid> {
    return this.tilesGridDBService.insert(fields);
  }

  public addTileGridBg(fields: Partial<ITilesGridBg>): Observable<ITilesGridBg> {
    return this.tilesGridBgDBService.insert(fields);
  }

  public fetchTilesGridsByFilter(filter: (item: ITilesGrid) => boolean): Observable<ITilesGrid[]> {
    return this.tilesGridDBService.getListByFilter(filter);
  }

  public fetchTilesGrids(projectId: number): Observable<ITilesGrid[]> {
    return this.tilesGridDBService.getListByFilter((item: ITilesGrid) => item.projectId === projectId);
  }

  public async useFrameInTilesGrid(frameId: number): Promise<boolean> {
    const list = await lastValueFrom(this.tilesGridDBService.getList());
    for (const grid of list) {
      for (const tile of grid.items) {
        if (tile.referenceId === frameId) {
          return true;
        }
      }
    }
    return false;
  }
}
