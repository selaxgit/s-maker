import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ISpriteAnimation } from '../../interfaces';
import { SpriteAnimationDBService } from './sprite-animation.db.service';

@Injectable({ providedIn: 'root' })
export class SpritesAnimationService {
  constructor(private readonly spriteAnimationDBService: SpriteAnimationDBService) {}

  public add(animation: Partial<ISpriteAnimation>): Observable<ISpriteAnimation> {
    return this.spriteAnimationDBService.add(animation);
  }

  public insert(animation: Partial<ISpriteAnimation>): Observable<ISpriteAnimation> {
    return this.spriteAnimationDBService.insert(animation);
  }

  public update(id: number, animation: Partial<ISpriteAnimation>): Observable<ISpriteAnimation> {
    return this.spriteAnimationDBService.update(id, animation);
  }

  public get(id: number): Observable<ISpriteAnimation> {
    return this.spriteAnimationDBService.get(id);
  }

  public remove(id: number): Observable<void> {
    return this.spriteAnimationDBService.remove(id);
  }

  public fetchAnimationsByFilter(filter: (item: ISpriteAnimation) => boolean): Observable<ISpriteAnimation[]> {
    return this.spriteAnimationDBService.getListByFilter(filter);
  }

  public fetchAnimations(spriteId: number): Observable<ISpriteAnimation[]> {
    return this.spriteAnimationDBService.getListByFilter((item: ISpriteAnimation) => item.spriteId === spriteId);
  }
}
