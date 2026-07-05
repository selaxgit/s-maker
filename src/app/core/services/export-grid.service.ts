import { inject, Injectable } from '@angular/core';
import { SUCanvasHelper, SUJsonHelper, SUStringHelper } from '@selax/utils';
import JSZip from 'jszip';
import { lastValueFrom } from 'rxjs';

import { DBFrames, DBGrid } from '~core/db';
import { ExportHelper } from '~core/helpers';
import { TransformHelper } from '~core/helpers/transform.helper';
import { IExportFrameDef, IFrame, IFramesDefinition } from '~core/interfaces';

@Injectable({
  providedIn: 'root',
})
export class ExportGridService {
  private readonly dbGrid = inject(DBGrid);

  private readonly dbFrames = inject(DBFrames);

  private errorsLog: string[] = [];

  getErrorsLog(): string[] {
    return this.errorsLog;
  }

  async exportGrid(gridId: number): Promise<void> {
    this.errorsLog = [];
    const grid = await lastValueFrom(this.dbGrid.get(gridId));
    if (!grid) {
      throw new Error('Сетка тайлов не найдена');
    }
    const zip = new JSZip();
    const gridJson = SUJsonHelper.clone(grid);
    gridJson.id = undefined;
    gridJson.background = undefined;
    gridJson.projectId = undefined;
    const framesIds: number[] = [];
    for (const item of gridJson.items) {
      framesIds.push(item.frameId);
      item.properties = TransformHelper.propertiesToFlat(item.properties ?? {});
    }
    let framesDefinitionInfo: IExportFrameDef[] = [];
    const definitionFrames: IFramesDefinition[] = [];
    if (framesIds.length > 0) {
      const framesList = await lastValueFrom(this.dbFrames.getListByFilter((i: IFrame) => framesIds.includes(i.id)));
      framesDefinitionInfo = await ExportHelper.getFramesDefinitionInfo(framesList);
    }

    let idx = 1;
    for (const defFrame of framesDefinitionInfo) {
      const textureName = framesDefinitionInfo.length > 1 ? `frames-pack-${idx}.png` : 'frames-pack.png';
      idx++;
      definitionFrames.push({ textureName, frames: defFrame.definition });
      const blob = await SUCanvasHelper.canvasToBlob(defFrame.canvas);
      const pngFile = new File([blob], textureName);
      zip.file(textureName, pngFile);
    }
    zip.file('grid-def.json', JSON.stringify(gridJson, null, 2));
    zip.file('frames-def.json', JSON.stringify(definitionFrames, null, 2));

    const filename = grid.name.toLowerCase().replace(/ /g, '-') + ' (grid-pack)';
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
}
