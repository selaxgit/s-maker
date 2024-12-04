import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { DBBase } from '../../classes';
import { ISpriteAnimation } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class SpriteAnimationDBService extends DBBase<ISpriteAnimation> {
  protected readonly tableName = 'sprites-animations';

  public add(animation: Partial<ISpriteAnimation>): Observable<ISpriteAnimation> {
    const data = Object.assign(
      {
        groundPoint: null,
        collisionFrame: null,
        layers: [],
      },
      animation,
    );
    delete data.id;
    return this.insert(data);
  }
}
