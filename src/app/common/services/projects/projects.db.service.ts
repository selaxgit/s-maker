import { Injectable } from '@angular/core';
import { forkJoin, Observable, switchMap } from 'rxjs';

import { DBBase } from '../../classes';
import { IProject } from '../../interfaces';
import { FramesDBService, FramesTreeDBService } from '../frames';
import { ScenesDBService } from '../scenes/scenes.db.service';
import { ScenesObjectsDBService } from '../scenes/scenes-objects.db.service';
import { SpriteLayersDBService, SpritesDBService, SpritesTreeDBService } from '../sprites';
import { SpriteAnimationDBService } from '../sprites/sprite-animation.db.service';
import { SpriteFramesDBService } from '../sprites/sprite-frames.db.service';
import { TilesGridDBService } from '../tiles/tiles-grid.db.service';
import { TilesGridBgDBService } from '../tiles/tiles-grid-bg.db.service';

@Injectable({ providedIn: 'root' })
export class ProjectsDBService extends DBBase<IProject> {
  protected readonly tableName = 'projects';

  constructor(
    private readonly framesTreeDBService: FramesTreeDBService,
    private readonly framesDBService: FramesDBService,
    private readonly spritesTreeDBService: SpritesTreeDBService,
    private readonly spritesDBService: SpritesDBService,
    private readonly spriteLayersDBService: SpriteLayersDBService,
    private readonly spriteFramesDBService: SpriteFramesDBService,
    private readonly spriteAnimationDBService: SpriteAnimationDBService,
    private readonly tilesGridDBService: TilesGridDBService,
    private readonly tilesGridBgDBService: TilesGridBgDBService,
    private readonly scenesDBService: ScenesDBService,
    private readonly scenesObjectsDBService: ScenesObjectsDBService,
  ) {
    super();
  }

  public override remove(id: number): Observable<void> {
    return forkJoin([
      this.framesTreeDBService.removeByFilter((item: { projectId: number }) => item.projectId === id),
      this.framesDBService.removeByFilter((item: { projectId: number }) => item.projectId === id),
      this.spritesTreeDBService.removeByFilter((item: { projectId: number }) => item.projectId === id),
      this.spritesDBService.removeByFilter((item: { projectId: number }) => item.projectId === id),
      this.spriteLayersDBService.removeByFilter((item: { projectId: number }) => item.projectId === id),
      this.spriteFramesDBService.removeByFilter((item: { projectId: number }) => item.projectId === id),
      this.spriteAnimationDBService.removeByFilter((item: { projectId: number }) => item.projectId === id),
      this.tilesGridDBService.removeByFilter((item: { projectId: number }) => item.projectId === id),
      this.tilesGridBgDBService.removeByFilter((item: { projectId: number }) => item.projectId === id),
      this.scenesDBService.removeByFilter((item: { projectId: number }) => item.projectId === id),
      this.scenesObjectsDBService.removeByFilter((item: { projectId: number }) => item.projectId === id),
    ]).pipe(switchMap(() => super.remove(id)));
  }
}
