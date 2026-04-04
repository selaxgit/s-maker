import { inject, Injectable } from '@angular/core';
import { SUStringHelper } from '@selax/utils';
import { from, Observable, of, switchMap, tap } from 'rxjs';

import { IFrame, ISprite, IViewTile } from '~core/interfaces';
import { FramesRepository, SpritesRepository } from '~core/repositories';
import { EditSpriteStore, ProjectStore, SpritesStore, SpritesTreeStore } from '~core/stores';

import { FramesFacade } from './frames.facade';

@Injectable({
  providedIn: 'root',
})
export class EditSpriteFacade {
  private readonly editSpriteStore = inject(EditSpriteStore);

  private readonly projectStore = inject(ProjectStore);

  private readonly spritesTreeStore = inject(SpritesTreeStore);

  private readonly spritesRepository = inject(SpritesRepository);

  private readonly spritesStore = inject(SpritesStore);

  private readonly framesRepository = inject(FramesRepository);

  private readonly framesFacade = inject(FramesFacade);

  addFrameToLayerFromFile(layerGuid: string, file: File, frameName: string): Observable<void> {
    return this.framesRepository.addFrameFromFile(file, null).pipe(
      switchMap((frame: IFrame) => {
        this.editSpriteStore.addFrameToLayer(layerGuid, {
          guid: SUStringHelper.uuidv4(),
          frameId: frame.id,
          name: frameName,
          x: 0,
          y: 0,
          width: frame.width,
          height: frame.height,
          visible: true,
          zIndex: 0,
        });
        return of(void 0);
      }),
    );
  }

  hasChanged(): boolean {
    return this.editSpriteStore.hasChanged();
  }

  cloneSprite(sourceSprite: ISprite, newName: string): Observable<ISprite> {
    return this.spritesRepository
      .saveSprite({
        ...sourceSprite,
        id: -1,
        name: newName,
      })
      .pipe(
        switchMap((sprite: ISprite) =>
          from(this.spritesRepository.spriteToTile(sprite, [])).pipe(
            switchMap((tile: IViewTile) => {
              this.spritesStore.addTile(tile);
              this.framesFacade.updateUsedFrames();
              return of(sprite);
            }),
          ),
        ),
      );
  }

  saveSprite(): Observable<ISprite> {
    return this.spritesRepository.saveSprite(this.editSpriteStore.sprite()!).pipe(
      tap((sprite: ISprite) => {
        this.framesFacade.updateUsedFrames();
        this.editSpriteStore.setSprite(sprite);
        this.spritesRepository.updateSpritePreview(sprite);
      }),
    );
  }

  fetchSprite(id: number): Observable<ISprite> {
    return this.spritesRepository.fetchSpriteById(id).pipe(
      tap((sprite: ISprite) => {
        this.editSpriteStore.setSprite(sprite);
      }),
    );
  }

  initNewSprite(): void {
    const projectId = this.projectStore.projectId();
    if (!projectId) {
      throw new Error('Project ID не установлен для создания спрайта');
    }
    this.editSpriteStore.setSprite({
      id: -1,
      projectId,
      treeId: this.spritesTreeStore.selectedNode()?.id ?? null,
      name: 'Новый спрайт',
      width: 128,
      height: 128,
      bgColor: null,
      groundPointX: null,
      groundPointY: null,
      visibleGroundPoint: false,
      layers: [],
      animations: [],
    });
    this.editSpriteStore.setHasChanged(true);
  }

  reset(): void {
    this.editSpriteStore.reset();
  }
}
