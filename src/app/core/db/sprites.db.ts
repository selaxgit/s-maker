import { Injectable } from '@angular/core';
import { SUDBBase } from '@selax/utils';

import { ISprite } from '~core/interfaces';

@Injectable({ providedIn: 'root' })
export class DBSprites extends SUDBBase<ISprite> {
  protected readonly tableName = 'sprites';
}
