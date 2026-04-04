import { inject, Injectable } from '@angular/core';
import { SUCanvasHelper, SUFileHelper, SUStringHelper } from '@selax/utils';
import JSZip from 'jszip';
import { lastValueFrom } from 'rxjs';

import { ExportSceneTypeEnum, SceneLayerTypeEnum } from '~core/constants';
import { DBFrames, DBGrid, DBScenes, DBSprites } from '~core/db';
import { ExportHelper } from '~core/helpers';
import {
  IFrame,
  IFramesDefinition,
  ISceneLayer,
  ISceneObjectSprite,
  ISpriteFrame,
  ISpriteLayer,
  ITilesGridItem,
} from '~core/interfaces';

@Injectable({
  providedIn: 'root',
})
export class ExportSceneService {
  private readonly dbFrames = inject(DBFrames);

  private readonly dbScenes = inject(DBScenes);

  private readonly dbSprites = inject(DBSprites);

  private readonly dbGrid = inject(DBGrid);

  private errorsLog: string[] = [];

  getErrorsLog(): string[] {
    return this.errorsLog;
  }

  async exportScene(sceneId: number, type: ExportSceneTypeEnum): Promise<void> {
    switch (type) {
      case ExportSceneTypeEnum.Full:
        return this.exportSceneFull(sceneId);
      case ExportSceneTypeEnum.Simple:
        return this.exportSceneSimple(sceneId);
    }
  }

  async exportSceneSimple(sceneId: number): Promise<void> {
    this.errorsLog = [];
    const scene = await lastValueFrom(this.dbScenes.get(sceneId));
    if (!scene) {
      throw new Error('Сцена не найдена');
    }
    const sceneDef = ExportHelper.sceneToDefinition(scene);
    const filename = scene.name.toLowerCase() + '.json';
    SUFileHelper.downloadJson(sceneDef, filename);
  }

  async exportSceneFull(sceneId: number): Promise<void> {
    this.errorsLog = [];
    const scene = await lastValueFrom(this.dbScenes.get(sceneId));
    if (!scene) {
      throw new Error('Сцена не найдена');
    }
    const zip = new JSZip();
    const sceneDef = ExportHelper.sceneToDefinition(scene);
    zip.file('scene.json', JSON.stringify(sceneDef, null, 2));
    for (const layer of scene.layers) {
      switch (layer.type) {
        case SceneLayerTypeEnum.Grids:
          await this.exportLayerGrid(layer, zip);
          break;
        case SceneLayerTypeEnum.Sprites: {
          const referenceIds: number[] = [];
          for (const object of layer.objects) {
            const sprite = object as ISceneObjectSprite;
            if (sprite.referenceId && referenceIds.includes(sprite.referenceId)) {
              continue;
            }
            await this.exportLayerSprite(sprite.referenceId, zip);
          }
          break;
        }
      }
    }

    const filename = scene.name.toLowerCase() + ' (scene-pack)';
    const base64 = await zip.generateAsync({ type: 'base64' });
    const blobSrc = new Blob([SUStringHelper.base64ToUint8(base64).buffer as ArrayBuffer], {
      type: 'data:application/zip;base64',
    });
    const url = URL.createObjectURL(blobSrc);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.zip`);
    link.click();
  }

  private async exportLayerSprite(spriteId: number | null, zip: JSZip): Promise<void> {
    if (!spriteId) {
      this.errorsLog.push(`Спрайт (${spriteId}) не указан`);
      return;
    }
    const sprite = await lastValueFrom(this.dbSprites.get(spriteId));
    if (!sprite) {
      this.errorsLog.push(`Спрайт (${spriteId}) не найден`);
      return;
    }
    const framesIds = sprite.layers
      .flatMap((layer: ISpriteLayer) => layer.frames)
      .map((item: ISpriteFrame) => item.frameId);
    const uniquieFramesIds = [...new Set(framesIds)];
    const framesList = await lastValueFrom(
      this.dbFrames.getListByFilter((i: IFrame) => uniquieFramesIds.includes(i.id)),
    );
    const framesDefinitionInfo = await ExportHelper.getSpriteFramesDefinitionInfo(framesList, sprite, this.errorsLog);
    const definitionSprite = ExportHelper.spriteToDefinition(sprite, sprite.id);
    definitionSprite.layers = framesDefinitionInfo.layers;

    const definitionFrames: IFramesDefinition[] = [];
    let idx = 1;
    const spriteName = sprite.name.toLowerCase().replace(/ /g, '-');
    for (const defFrame of framesDefinitionInfo.framesDef) {
      const textureName =
        framesDefinitionInfo.framesDef.length > 1
          ? `${sprite.id}-${spriteName}-${idx}.png`
          : `${sprite.id}-${spriteName}.png`;
      idx++;
      definitionFrames.push({ textureName, frames: defFrame.definition });
      const blob = await SUCanvasHelper.canvasToBlob(defFrame.canvas);
      const pngFile = new File([blob], textureName);
      zip.file(textureName, pngFile);
    }
    zip.file(
      `sprite--${spriteName}-${sprite.id}.json`,
      JSON.stringify(
        {
          definitionSprite,
          definitionFrames,
        },
        null,
        2,
      ),
    );
  }

  private async exportLayerGrid(layer: ISceneLayer, zip: JSZip): Promise<void> {
    if (!layer.referenceGridId) {
      this.errorsLog.push(`Сетка тайлов (${layer.referenceGridId}) не указана`);
      return;
    }
    const grid = await lastValueFrom(this.dbGrid.get(layer.referenceGridId));
    if (!grid) {
      this.errorsLog.push(`Сетка тайлов (${layer.referenceGridId}) не найдена`);
      return;
    }
    const framesIds = grid.items.map((item: ITilesGridItem) => item.frameId);
    const uniquieFramesIds = [...new Set(framesIds)];
    const framesList = await lastValueFrom(
      this.dbFrames.getListByFilter((i: IFrame) => uniquieFramesIds.includes(i.id)),
    );
    const framesDefinitionInfo = await ExportHelper.getFramesDefinitionInfo(framesList, this.errorsLog);
    const definitionFrames: IFramesDefinition[] = [];
    let idx = 1;
    const gridName = grid.name.toLowerCase().replace(/ /g, '-');
    for (const defFrame of framesDefinitionInfo) {
      const textureName =
        framesDefinitionInfo.length > 1 ? `${grid.id}-${gridName}-${idx}.png` : `${grid.id}-${gridName}.png`;
      idx++;
      definitionFrames.push({ textureName, frames: defFrame.definition });
      const blob = await SUCanvasHelper.canvasToBlob(defFrame.canvas);
      const pngFile = new File([blob], textureName);
      zip.file(textureName, pngFile);
    }
    const definitionGrid = ExportHelper.gridToDefinition(grid, grid.id);
    zip.file(
      `grid--${gridName}-${grid.id}.json`,
      JSON.stringify(
        {
          definitionGrid,
          definitionFrames,
        },
        null,
        2,
      ),
    );
  }
}
