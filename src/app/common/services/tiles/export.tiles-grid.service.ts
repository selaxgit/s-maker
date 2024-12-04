import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { lastValueFrom } from 'rxjs';

import { IPackerNode, TexturePacker } from '../../classes';
import { CanvasHelper, StringHelper, TransformHelper } from '../../helpers';
import {
  IExportFrameDef,
  IFileInfo,
  IFrame,
  IFramesDefinition,
  IRect,
  ITilesGridItem,
  TEXTURE_PACKER_HEIGHT,
  TEXTURE_PACKER_WIDTH,
} from '../../interfaces';
import { FramesService } from '../frames';
import { TilesGridService } from './tiles-grid.service';

@Injectable({
  providedIn: 'root',
})
export class ExportTilesGridService {
  constructor(
    private readonly tilesGridService: TilesGridService,
    private readonly framesService: FramesService,
  ) {}

  public async exportTileGridPack(gridId: number): Promise<void> {
    const grid = await lastValueFrom(this.tilesGridService.getTileGrid(gridId));
    const defFrames = grid.items.length > 0 ? await this.generateSceneDef(grid.items) : [];
    const zip = new JSZip();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (grid.items || []).forEach((i: any) => {
      i.properties = TransformHelper.propertiesToFlat(i.properties ?? {});
    });
    zip.file(
      'grid-def.json',
      JSON.stringify(
        {
          id: grid.id,
          items: grid.items,
          mapInfo: grid.mapInfo,
          name: grid.name,
          tileInfo: grid.tileInfo,
        },
        null,
        2,
      ),
    );
    const definitionFrames: IFramesDefinition[] = [];
    let idx = 1;
    for (const defFrame of defFrames) {
      const textureName = defFrames.length > 1 ? `frames-pack-${idx}.png` : 'frames-pack.png';
      idx++;
      definitionFrames.push({ textureName, frames: defFrame.definition });
      try {
        const blob = await CanvasHelper.canvasToBlob(defFrame.canvas as HTMLCanvasElement);
        const pngFile = new File([blob], textureName);
        zip.file(textureName, pngFile);
      } catch (error) {
        throw error;
      }
    }
    zip.file('frames-def.json', JSON.stringify(definitionFrames, null, 2));

    const gridName = grid.name.toLowerCase().replace(/ /g, '-') + ' (grid-pack)';
    const base64 = await zip.generateAsync({ type: 'base64' });
    const blobSrc = new Blob([StringHelper.base64ToUint8(base64)], {
      type: 'data:application/zip;base64',
    });
    const url = URL.createObjectURL(blobSrc);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${gridName}.zip`);
    link.click();
  }

  private async generateSceneDef(items: ITilesGridItem[]): Promise<IExportFrameDef[]> {
    const filesIds = items.map((i: ITilesGridItem) => i.referenceId);
    const files = await lastValueFrom(this.framesService.fetchByFilter((i: IFrame) => filesIds.includes(i.id)));
    let filesList: IFileInfo[] = [];
    files.forEach((i: IFrame) =>
      filesList.push({
        id: i.id,
        width: i.width,
        height: i.height,
        file: i.file,
      }),
    );
    const filesMap: Map<number, IFileInfo> = new Map();
    filesList.forEach((i: IFileInfo) => filesMap.set(i.id, { ...i }));
    const maxWidth = filesList.reduce((acc: number, curr: IFileInfo) => (acc > curr.width ? acc : curr.width), 0);
    const maxHeight = filesList.reduce((acc: number, curr: IFileInfo) => (acc > curr.height ? acc : curr.height), 0);
    const framesDef: IExportFrameDef[] = [];
    while (filesList.length > 0) {
      const nodes: IPackerNode[] = filesList.map((i: IFileInfo) => ({
        w: i.width,
        h: i.height,
        id: i.id,
      }));
      if (maxWidth > maxHeight) {
        nodes.sort((a: IPackerNode, b: IPackerNode) => a.w - b.w);
      } else {
        nodes.sort((a: IPackerNode, b: IPackerNode) => a.h - b.h);
      }
      const texturePacker = new TexturePacker(TEXTURE_PACKER_WIDTH, TEXTURE_PACKER_HEIGHT);
      texturePacker.fit(nodes);
      const definition: {
        frameId: number;
        rect: IRect;
      }[] = [];
      const fids: number[] = [];
      const canvas = document.createElement('canvas');
      const wh = texturePacker.getDimesion();
      canvas.width = wh.width;
      canvas.height = wh.height;
      for (const node of nodes) {
        const fileInfo = filesMap.get(Number(node.id));
        if (!fileInfo) {
          console.error(`No Node FileInfo ${node.id}`);
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
        await CanvasHelper.drawFileOnCanvas(
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
      filesList = filesList.filter((i: IFileInfo) => fids.includes(i.id));
    }
    return framesDef;
  }
}
