import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import { DBBase } from '../../classes';
import { ISpriteLayer } from '../../interfaces';
import { SpriteFramesDBService } from './sprite-frames.db.service';

@Injectable({ providedIn: 'root' })
export class SpriteLayersDBService extends DBBase<ISpriteLayer> {
  protected readonly tableName = 'sprites-layers';

  constructor(private readonly spriteFramesDBService: SpriteFramesDBService) {
    super();
  }

  public override remove(id: number): Observable<void> {
    return this.spriteFramesDBService
      .removeByFilter((item: { layerId: number }) => item.layerId === id)
      .pipe(switchMap(() => super.remove(id)));
  }

  public add(projectId: number, spriteId: number, name: string): Observable<ISpriteLayer> {
    return this.insert({
      projectId,
      spriteId,
      name,
      x: 0,
      y: 0,
      zIndex: 0,
      visible: true,
      bgColor: null,
      flipHorizontal: false,
      flipVertical: false,
    });
  }
}
