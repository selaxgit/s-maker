import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import { DBBase } from '../../classes';
import { IScene } from '../../interfaces';
import { ScenesObjectsDBService } from './scenes-objects.db.service';

@Injectable({ providedIn: 'root' })
export class ScenesDBService extends DBBase<IScene> {
  protected readonly tableName = 'scenes';

  constructor(private readonly scenesObjectsDBService: ScenesObjectsDBService) {
    super();
  }

  public override remove(id: number): Observable<void> {
    return this.scenesObjectsDBService
      .removeByFilter((item: { sceneId: number }) => item.sceneId === id)
      .pipe(switchMap(() => super.remove(id)));
  }
}
