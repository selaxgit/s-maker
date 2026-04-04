import { Injectable } from '@angular/core';
import { SUDBBase } from '@selax/utils';

import { IScene } from '~core/interfaces';

@Injectable({ providedIn: 'root' })
export class DBScenes extends SUDBBase<IScene> {
  protected readonly tableName = 'scenes';
}
