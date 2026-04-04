import { inject, Injectable } from '@angular/core';
import { SUStringHelper } from '@selax/utils';
import { lastValueFrom, Observable, of, switchMap } from 'rxjs';

import { DBSprites } from '~core/db';
import { ISprite } from '~core/interfaces';
import { FramesRepository } from '~core/repositories';

@Injectable({
  providedIn: 'root',
})
export class SpriteService {
  private readonly framesRepository = inject(FramesRepository);

  private readonly dbSprites = inject(DBSprites);

  getSpriteFramesIds(projectId: number): Observable<number[]> {
    return this.dbSprites
      .getListByFilter((item: ISprite) => item.projectId == projectId)
      .pipe(
        switchMap((sprites: ISprite[]) => {
          const framesIds = new Set<number>();
          for (const sprite of sprites) {
            for (const layer of sprite.layers) {
              for (const frame of layer.frames) {
                framesIds.add(frame.frameId);
              }
            }
          }
          return of(Array.from(framesIds));
        }),
      );
  }

  async multiCreateSprites(
    projectId: number,
    framesTreeId: number | null,
    treeId: number | null,
    fileList: File[],
    callback: (message: string) => void,
  ): Promise<void> {
    const count = fileList.length;
    let idx = 1;
    for (const file of fileList) {
      callback(`Генерация спрайтов (${idx} из ${count})...`);
      await this.createSpriteFromFile(projectId, framesTreeId, treeId, file);
      idx++;
    }
  }

  private async createSpriteFromFile(
    projectId: number,
    framesTreeId: number | null,
    treeId: number | null,
    file: File,
  ): Promise<ISprite | null> {
    const frame = await lastValueFrom(this.framesRepository.addFrameFromFile(file, framesTreeId));
    if (!frame) {
      return null;
    }
    const spriteName = file.name.split('.').slice(0, -1).join('.');
    return await lastValueFrom(
      this.dbSprites.insert({
        projectId,
        treeId,
        name: spriteName,
        width: frame.width,
        height: frame.height,
        bgColor: null,
        groundPointX: null,
        groundPointY: null,
        visibleGroundPoint: false,
        layers: [
          {
            guid: SUStringHelper.uuidv4(),
            name: 'Layer 1',
            visible: true,
            x: 0,
            y: 0,
            zIndex: 0,
            bgColor: null,
            flipHorizontal: false,
            flipVertical: false,
            frames: [
              {
                guid: SUStringHelper.uuidv4(),
                frameId: frame.id,
                name: 'Frame 1',
                x: 0,
                y: 0,
                width: frame.width,
                height: frame.height,
                zIndex: 0,
                visible: true,
              },
            ],
          },
        ],
        animations: [],
      }),
    );
  }
}
