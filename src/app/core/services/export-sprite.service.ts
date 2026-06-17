import { inject, Injectable } from '@angular/core';
import {
  ISUPackerNode,
  ISURect,
  SUCanvasHelper,
  SUJsonHelper,
  SUNumberHelper,
  SUStringHelper,
  SUTexturePacker,
  TEXTURE_PACKER_HEIGHT,
  TEXTURE_PACKER_WIDTH,
} from '@selax/utils';
import JSZip from 'jszip';
import { lastValueFrom } from 'rxjs';

import { ExportSpriteTypeEnum } from '~constants/sprite.constants';
import { DBFrames, DBSprites } from '~core/db';
import { UtilsHelper } from '~core/helpers';
import {
  IFrame,
  IFramesDefinition,
  ISprite,
  ISpriteAnimation,
  ISpriteAnimationLayer,
  ISpriteFrame,
  ISpriteLayer,
} from '~core/interfaces';

import * as pkg from '../../../../package.json';

interface IFramesDefinitionInfo {
  definition: IFramesDefinition[];
  canvas: HTMLCanvasElement;
  layers?: { guid: string; frames: number[] }[];
}

interface IFileInfo {
  id: number;
  width: number;
  height: number;
  file: File;
}

@Injectable({
  providedIn: 'root',
})
export class ExportSpriteService {
  private readonly version: string = '???';

  private readonly dbSprites = inject(DBSprites);

  private readonly dbFrames = inject(DBFrames);

  private errorsLog: string[] = [];

  constructor() {
    this.version = pkg.version;
  }

  getErrorsLog(): string[] {
    return this.errorsLog;
  }

  async exportSprite(spriteId: number, type: ExportSpriteTypeEnum): Promise<void> {
    this.errorsLog = [];
    const sprite = await lastValueFrom(this.dbSprites.get(spriteId));
    if (!sprite) {
      throw new Error('Спрайт не найден');
    }
    let spriteDef = SUJsonHelper.clone(sprite);
    delete spriteDef.id;
    delete spriteDef.projectId;
    delete spriteDef.treeId;
    const framesIds = sprite.layers
      .flatMap((layer: ISpriteLayer) => layer.frames)
      .map((item: ISpriteFrame) => item.frameId);
    const uniquieFramesIds = [...new Set(framesIds)];
    const framesList = await lastValueFrom(
      this.dbFrames.getListByFilter((i: IFrame) => uniquieFramesIds.includes(i.id)),
    );
    const zip = new JSZip();
    let framesDefinitionInfo: IFramesDefinitionInfo | null = null;
    if (type === ExportSpriteTypeEnum.Default) {
      zip.file('version.json', JSON.stringify({ smVersion: this.version }));
      framesDefinitionInfo = await this.getFramesDefinitionInfoDefault(framesList);
    } else if (type === ExportSpriteTypeEnum.ForGame) {
      spriteDef = {
        name: spriteDef.name,
        width: spriteDef.width,
        height: spriteDef.height,
        bgColor: undefined,
        groundPointX: undefined,
        groundPointY: undefined,
        visibleGroundPoint: undefined,
        groundPoint:
          SUNumberHelper.isNumber(spriteDef.groundPointX) && SUNumberHelper.isNumber(spriteDef.groundPointY)
            ? { x: spriteDef.groundPointX, y: spriteDef.groundPointY }
            : null,
        layers: spriteDef.layers.map((layer: ISpriteLayer) => ({
          guid: layer.guid,
          name: undefined,
          x: undefined,
          y: undefined,
          visible: undefined,
          zIndex: layer.zIndex,
          bgColor: undefined,
          flipHorizontal: undefined,
          flipVertical: undefined,
          frames: layer.frames.map((frame: ISpriteFrame) => frame.frameId),
        })),
        animations: spriteDef.animations.map((animation: ISpriteAnimation) => ({
          ...animation,
          guid: undefined,
          visibleGroundPoint: undefined,
          visibleCollisionFrame: undefined,
          layers: animation.layers.map((layer: ISpriteAnimationLayer) => ({
            ...layer,
            layerName: undefined,
            frames: UtilsHelper.hasRecordValue(layer.frames) ? layer.frames : undefined,
          })),
        })),
      };
      framesDefinitionInfo = await this.getFramesDefinitionInfoForGame(framesList, sprite);
      spriteDef.layers = framesDefinitionInfo.layers ?? [];
    }
    zip.file('sprite-def.json', JSON.stringify(spriteDef, null, 2));
    if (framesDefinitionInfo) {
      zip.file('frames-def.json', JSON.stringify(framesDefinitionInfo.definition, null, 2));
      const blob = await SUCanvasHelper.canvasToBlob(framesDefinitionInfo.canvas);
      const pngFile = new File([blob], 'texture.png');
      zip.file('texture.png', pngFile);
    }

    let filename = sprite.name.toLowerCase().replace(/ /g, '-');
    if (type === ExportSpriteTypeEnum.Default) {
      filename += ' (sprite-pack)';
    } else if (type === ExportSpriteTypeEnum.ForGame) {
      filename += ' (sprite-pack-for-game)';
    }
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

  private async getFramesDefinitionInfoForGame(framesList: IFrame[], sprite: ISprite): Promise<IFramesDefinitionInfo> {
    const framesMap = new Map<number, IFrame>();
    for (const item of framesList) {
      framesMap.set(item.id, item);
    }
    const fileListMap = new Map<string, number>();
    const filesMap = new Map<number, IFileInfo>();
    let fileIdx = 0;
    const layers: { guid: string; frames: number[] }[] = [];
    for (const layer of sprite.layers) {
      const framesIds: number[] = [];
      let fileId;
      for (const frame of layer.frames) {
        const fp = layer.flipHorizontal ? 'true' : 'false';
        const fv = layer.flipHorizontal ? 'true' : 'false';
        const key = `${frame.frameId}-${fp}-${fv}`;
        if (fileListMap.has(key)) {
          fileId = fileListMap.get(key) as number;
        } else {
          const frameFile = await this.generateFrameFile(
            frame,
            framesMap.get(frame.frameId) ?? null,
            sprite.width,
            sprite.height,
            layer.x,
            layer.y,
            layer.flipHorizontal,
            layer.flipVertical,
          );
          if (!frameFile) {
            throw new Error('Что-то пошло не так....');
          }
          fileIdx++;
          fileId = fileIdx;
          filesMap.set(fileId, {
            id: fileId,
            width: sprite.width,
            height: sprite.height,
            file: frameFile,
          });
          fileListMap.set(key, fileId);
        }
        framesIds.push(fileId);
      }
      layers.push({
        guid: layer.guid,
        frames: [...framesIds],
      });
    }
    const nodes: ISUPackerNode[] = [];
    for (const item of filesMap.values()) {
      nodes.push({
        w: item.width,
        h: item.height,
        id: item.id,
      });
    }
    const texturePacker = new SUTexturePacker(TEXTURE_PACKER_WIDTH, TEXTURE_PACKER_HEIGHT);
    texturePacker.fit(nodes);
    const framesDef: {
      frameId: number;
      rect: ISURect;
    }[] = [];
    const canvas = document.createElement('canvas');
    const wh = texturePacker.getDimesion();
    canvas.width = wh.width;
    canvas.height = wh.height;
    for (const node of nodes) {
      const fileInfo = filesMap.get(Number(node.id));
      if (!fileInfo) {
        this.errorsLog.push(`No Node FileInfo ${node.id}`);
        continue;
      }
      if (!node.fit) {
        this.errorsLog.push(`No Node.FIT ${node.id}`);
        continue;
      }
      framesDef.push({
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
    return {
      definition: [
        {
          textureName: 'texture.png',
          frames: framesDef,
        },
      ],
      canvas,
      layers,
    };
  }

  private async generateFrameFile(
    spriteFrame: ISpriteFrame,
    frame: IFrame | null,
    width: number,
    height: number,
    layerX: number,
    layerY: number,
    flipHorizontal: boolean,
    flipVertical: boolean,
  ): Promise<File | null> {
    if (!frame) {
      throw new Error('Фрейм не найден');
    }
    let source: HTMLCanvasElement | null = await SUCanvasHelper.fileToCanvas(frame.file);
    if (flipHorizontal) {
      source = SUCanvasHelper.canvasFlipHorizontal(source);
      if (!source) {
        return null;
      }
    }
    if (flipVertical) {
      source = SUCanvasHelper.canvasFlipVertical(source);
      if (!source) {
        return null;
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    ctx.drawImage(source, layerX + spriteFrame.x, layerY + spriteFrame.y);
    const blob = await SUCanvasHelper.canvasToBlob(canvas);
    return new File([blob], frame.file.name);
  }

  private async getFramesDefinitionInfoDefault(framesList: IFrame[]): Promise<IFramesDefinitionInfo> {
    const framesMap = new Map<number, IFrame>();
    for (const item of framesList) {
      framesMap.set(item.id, item);
    }
    const nodes: ISUPackerNode[] = [];
    for (const frame of framesMap.values()) {
      nodes.push({
        w: frame.width,
        h: frame.height,
        id: frame.id,
      });
    }
    const texturePacker = new SUTexturePacker(TEXTURE_PACKER_WIDTH, TEXTURE_PACKER_HEIGHT);
    texturePacker.fit(nodes);
    const framesDef: {
      frameId: number;
      rect: ISURect;
    }[] = [];
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
        this.errorsLog.push(`No Node.FIT ${node.id}`);
        continue;
      }
      framesDef.push({
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
    return {
      definition: [
        {
          textureName: 'texture.png',
          frames: framesDef,
        },
      ],
      canvas,
    };
  }
}
