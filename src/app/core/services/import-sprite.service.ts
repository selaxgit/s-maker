import { inject, Injectable } from '@angular/core';
import { SUCanvasHelper, SUVersionHelper } from '@selax/utils';
import JSZip from 'jszip';
import { lastValueFrom } from 'rxjs';

import { DBFrames, DBFramesTree, DBSprites } from '~core/db';
import { IFramesDefinition, ISMVersion, ISprite, ISpriteFrame } from '~core/interfaces';
import { ZipHelper } from '~helpers/zip.helper';

@Injectable({
  providedIn: 'root',
})
export class ImportSpriteService {
  private readonly dbFramesTree = inject(DBFramesTree);

  private readonly dbFrames = inject(DBFrames);

  private readonly dbSprites = inject(DBSprites);

  private errorsLog: string[] = [];

  getErrorsLogs(): string[] {
    return this.errorsLog;
  }

  async importSprite(projectId: number, treeId: number | null, data: ArrayBuffer): Promise<void> {
    this.errorsLog = [];
    const zip = new JSZip();
    const zipData = await zip.loadAsync(data);
    const versionJson = await ZipHelper.getJSONFromZip<ISMVersion>(zipData, 'version.json');
    if (versionJson?.smVersion) {
      if (SUVersionHelper.satisfies(versionJson.smVersion, '^5.0.0')) {
        return this.importCurrentVersion(projectId, treeId, zipData);
      }
    }
    throw new Error('Несовместимая версия файла импорта');
  }

  private async importCurrentVersion(projectId: number, treeId: number | null, zipData: JSZip): Promise<void> {
    const spriteJson = await ZipHelper.getJSONFromZip<Partial<ISprite>>(zipData, 'sprite-def.json');
    if (!spriteJson) {
      throw new Error('Нет данных о спрайте');
    }
    const framesJson = await ZipHelper.getJSONFromZip<IFramesDefinition[]>(zipData, 'frames-def.json');
    const canvasTexture = await ZipHelper.getCanvasFromZip(zipData, 'texture.png');
    if (canvasTexture && framesJson) {
      const framesTree = await lastValueFrom(
        this.dbFramesTree.insert({
          projectId,
          parentId: null,
          name: spriteJson.name,
        }),
      );
      const framesMap = new Map<number, number>();
      for (const frameInfo of framesJson) {
        let idx = 1;
        for (const frame of frameInfo.frames) {
          const fileName = `${spriteJson.name}-file-${idx}`;
          const file = await SUCanvasHelper.cropCanvasToFile(fileName, canvasTexture, frame.rect);
          if (!file) {
            this.errorsLog.push(`Passed frameId: ${frame.frameId}`);
            continue;
          }
          const newFrame = await lastValueFrom(this.dbFrames.add(projectId, framesTree.id, file));
          framesMap.set(frame.frameId, newFrame.id);
          idx++;
        }
      }
      for (const layer of spriteJson.layers || []) {
        layer.frames = layer.frames
          .map((frame: ISpriteFrame) => ({
            ...frame,
            frameId: framesMap.get(frame.frameId) ?? -1,
          }))
          .filter((frame: ISpriteFrame) => {
            if (frame.frameId > 0) {
              return true;
            } else {
              this.errorsLog.push(`Passed frame: ${frame.name}, layer: ${layer.name}`);
              return false;
            }
          });
      }
    } else {
      for (const layer of spriteJson.layers || []) {
        layer.frames = [];
      }
      for (const animation of spriteJson.animations || []) {
        for (const layer of animation.layers || []) {
          layer.frames = {};
        }
      }
    }
    spriteJson.projectId = projectId;
    spriteJson.treeId = treeId;
    await lastValueFrom(this.dbSprites.insert(spriteJson));
  }
}
