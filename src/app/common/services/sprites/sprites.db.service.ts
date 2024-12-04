import { Injectable } from '@angular/core';
import { forkJoin, Observable, switchMap } from 'rxjs';

import { DBBase } from '../../classes';
import { ISprite } from '../../interfaces';
import { SpriteAnimationDBService } from './sprite-animation.db.service';
import { SpriteFramesDBService } from './sprite-frames.db.service';
import { SpriteLayersDBService } from './sprite-layers.db.service';

@Injectable({ providedIn: 'root' })
export class SpritesDBService extends DBBase<ISprite> {
  protected readonly tableName = 'sprites';

  constructor(
    private readonly spriteFramesDBService: SpriteFramesDBService,
    private readonly spriteLayersDBService: SpriteLayersDBService,
    private readonly spriteAnimationDBService: SpriteAnimationDBService,
  ) {
    super();
  }

  public add(projectId: number, treeId: number | null, name: string): Observable<ISprite> {
    return this.insert({
      projectId,
      treeId: treeId,
      name,
      width: 128,
      height: 128,
      bgColor: null,
      groundPointX: 64,
      groundPointY: 128,
      visibleGroundPoint: false,
    });
  }

  public override remove(id: number): Observable<void> {
    return forkJoin([
      this.spriteLayersDBService.removeByFilter((item: { spriteId: number }) => item.spriteId === id),
      this.spriteFramesDBService.removeByFilter((item: { spriteId: number }) => item.spriteId === id),
      this.spriteAnimationDBService.removeByFilter((item: { spriteId: number }) => item.spriteId === id),
    ]).pipe(switchMap(() => super.remove(id)));
  }
}
