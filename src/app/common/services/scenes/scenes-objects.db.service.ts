import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import { DBBase } from '../../classes';
import { ISceneObject } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class ScenesObjectsDBService extends DBBase<ISceneObject> {
  protected readonly tableName = 'scenes-objects';

  public removeObject(id: number): Observable<void> {
    return this.removeByFilter((item: ISceneObject) => item.parentId === id).pipe(switchMap(() => super.remove(id)));
  }
}
