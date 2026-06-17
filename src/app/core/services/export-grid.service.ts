import { inject, Injectable } from '@angular/core';
import {
  ISUPackerNode,
  ISURect,
  SUCanvasHelper,
  SUJsonHelper,
  SUStringHelper,
  SUTexturePacker,
  TEXTURE_PACKER_HEIGHT,
  TEXTURE_PACKER_WIDTH,
} from '@selax/utils';
import JSZip from 'jszip';
import { lastValueFrom } from 'rxjs';

import { DBFrames, DBGrid } from '~core/db';
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
    const framesDefinitionInfo = framesIds.length > 0 ? await this.getFramesDefinitionInfo(framesIds) : [];
    const definitionFrames: IFramesDefinition[] = [];
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

  private async getFramesDefinitionInfo(framesIds: number[]): Promise<IExportFrameDef[]> {
    const framesList = await lastValueFrom(this.dbFrames.getListByFilter((i: IFrame) => framesIds.includes(i.id)));
    const framesMap = new Map<number, IFrame>();
    for (const item of framesList) {
      framesMap.set(item.id, item);
    }
    let maxWidth = 0;
    let maxHeight = 0;
    for (const frame of framesMap.values()) {
      if (frame.width > maxWidth) {
        maxWidth = frame.width;
      }
      if (frame.height > maxHeight) {
        maxHeight = frame.height;
      }
    }
    const framesDef: IExportFrameDef[] = [];
    while (framesMap.size > 0) {
      const nodes: ISUPackerNode[] = [];
      for (const frame of framesMap.values()) {
        nodes.push({
          w: frame.width,
          h: frame.height,
          id: frame.id,
        });
      }
      if (maxWidth > maxHeight) {
        nodes.sort((a: ISUPackerNode, b: ISUPackerNode) => a.w - b.w);
      } else {
        nodes.sort((a: ISUPackerNode, b: ISUPackerNode) => a.h - b.h);
      }
      const texturePacker = new SUTexturePacker(TEXTURE_PACKER_WIDTH, TEXTURE_PACKER_HEIGHT);
      texturePacker.fit(nodes);
      const definition: {
        frameId: number;
        rect: ISURect;
      }[] = [];
      const fids: number[] = [];
      const canvas = document.createElement('canvas');
      const wh = texturePacker.getDimesion();
      canvas.width = wh.width;
      canvas.height = wh.height;
      for (const node of nodes) {
        const fileInfo = framesMap.get(Number(node.id));
        if (!fileInfo) {
          this.errorsLog.push(`No Node FileInfo ${node.id}`);
          continue;
        }
        if (!node.fit) {
          fids.push(Number(node.id));
          continue;
        }
        definition.push({
          frameId: Number(node.id),
          rect: {
            x: Number(node.fit?.x),
            y: Number(node.fit?.y),
            width: node.w,
            height: node.h,
          },
        });
        await SUCanvasHelper.drawFileOnCanvas(
          canvas,
          Number(node.fit?.x),
          Number(node.fit?.y),
          node.w,
          node.h,
          fileInfo.file,
        );
      }
      framesDef.push({
        definition,
        canvas,
      });
      for (const key of framesMap.keys()) {
        if (!fids.includes(key)) {
          framesMap.delete(key);
        }
      }
    }
    return framesDef;
  }
}
