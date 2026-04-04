import { Injectable } from '@angular/core';
import { SUDBBase } from '@selax/utils';

import { ITilesGrid } from '~core/interfaces';

@Injectable({ providedIn: 'root' })
export class DBGrid extends SUDBBase<ITilesGrid> {
  protected readonly tableName = 'tiles-grid';
}
