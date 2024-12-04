import { Injectable } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';

import { ISpriteFrame, ISpriteLayer, ISpriteLayersListItem } from '../../interfaces';
import { SpriteFramesDBService } from './sprite-frames.db.service';
import { SpriteLayersDBService } from './sprite-layers.db.service';

@Injectable({ providedIn: 'root' })
export class SpriteLayersService {
  constructor(
    private readonly spriteLayersDBService: SpriteLayersDBService,
    private readonly spriteFramesDBService: SpriteFramesDBService,
  ) {}

  public remove(id: number): Observable<void> {
    return this.spriteLayersDBService.remove(id);
  }

  public batchUpdate(ids: number[], layer: Partial<ISpriteLayer>): Observable<void> {
    return this.spriteLayersDBService.batchUpdate(ids, layer);
  }

  public update(id: number, layer: Partial<ISpriteLayer>): Observable<ISpriteLayer> {
    return this.spriteLayersDBService.update(id, layer);
  }

  public add(projectId: number, spriteId: number, name: string): Observable<ISpriteLayer> {
    return this.spriteLayersDBService.add(projectId, spriteId, name);
  }

  public insert(fields: Partial<ISpriteLayer>): Observable<ISpriteLayer> {
    return this.spriteLayersDBService.insert(fields);
  }

  public fetchByFilter(filter: (item: ISpriteLayer) => boolean): Observable<ISpriteLayer[]> {
    return this.spriteLayersDBService.getListByFilter(filter);
  }

  public fetchLayers(spriteId: number): Observable<ISpriteLayer[]> {
    return this.spriteLayersDBService.getListByFilter((item: ISpriteLayer) => item.spriteId === spriteId);
  }

  public getListWithFramesByFilter(
    filter: (item: { spriteId: number }) => boolean,
  ): Observable<ISpriteLayersListItem[]> {
    return this.spriteLayersDBService.getListByFilter(filter).pipe(
      switchMap((layers: ISpriteLayer[]) =>
        this.spriteFramesDBService.getListByFilter(filter).pipe(
          switchMap((frames: ISpriteFrame[]) => {
            const layersList: ISpriteLayersListItem[] = layers
              .sort((a: ISpriteLayer, b: ISpriteLayer) => (a.order ?? Infinity) - (b.order ?? Infinity))
              .map((layer: ISpriteLayer) => ({
                ...layer,
                frames: frames
                  .filter((frame: ISpriteFrame) => frame.layerId === layer.id)
                  .sort((a: ISpriteFrame, b: ISpriteFrame) => (a.order ?? Infinity) - (b.order ?? Infinity)),
              }));
            return of(layersList);
          }),
        ),
      ),
    );
  }

  public getListWithFrames(spriteId: number): Observable<ISpriteLayersListItem[]> {
    return this.spriteLayersDBService
      .getListByFilter((layer: ISpriteLayer) => layer.spriteId === spriteId)
      .pipe(
        switchMap((layers: ISpriteLayer[]) =>
          this.spriteFramesDBService
            .getListByFilter((frame: ISpriteFrame) => frame.spriteId === spriteId)
            .pipe(
              switchMap((frames: ISpriteFrame[]) => {
                const layersList: ISpriteLayersListItem[] = layers
                  .sort((a: ISpriteLayer, b: ISpriteLayer) => (a.order ?? Infinity) - (b.order ?? Infinity))
                  .map((layer: ISpriteLayer) => ({
                    ...layer,
                    frames: frames
                      .filter((frame: ISpriteFrame) => frame.layerId === layer.id)
                      .sort((a: ISpriteFrame, b: ISpriteFrame) => (a.order ?? Infinity) - (b.order ?? Infinity)),
                  }));
                return of(layersList);
              }),
            ),
        ),
      );
  }
}
