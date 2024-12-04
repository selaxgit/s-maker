import { Injectable } from '@angular/core';

import { DBBase } from '../../classes';
import { ITilesGridBg } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class TilesGridBgDBService extends DBBase<ITilesGridBg> {
  protected readonly tableName = 'tiles-grid-bg';
}
