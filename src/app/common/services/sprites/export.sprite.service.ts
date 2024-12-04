import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { lastValueFrom } from 'rxjs';

import { IPackerNode, TexturePacker } from '../../classes';
import { CanvasHelper, StringHelper } from '../../helpers';
import {
  IFileInfo,
  IFramesDefinition,
  IRect,
  ISpriteAnimation,
  ISpriteAnimationLayer,
  ISpriteDefinition,
  ISpriteDefinitionForGame,
  ISpriteFrame,
  ISpriteFrameDefinition,
  ISpriteLayerDefinition,
  TEXTURE_PACKER_HEIGHT,
  TEXTURE_PACKER_WIDTH,
} from '../../interfaces';
import { SpritesAnimationService } from './sprite-animation.service';
import { SpriteLayersService } from './sprite-layers.service';
import { SpritesService } from './sprites.service';

@Injectable({
  providedIn: 'root',
})
export class ExportSpriteService {
  constructor(
    private readonly spritesService: SpritesService,
    private readonly spriteLayersService: SpriteLayersService,
    private readonly spritesAnimationService: SpritesAnimationService,
  ) {}

  public async exportSpritePackForGame(spriteId: number): Promise<void> {
    const sprite = await lastValueFrom(this.spritesService.get(spriteId));
    const layers = await lastValueFrom(this.spriteLayersService.getListWithFrames(spriteId));
    const animations = await lastValueFrom(this.spritesAnimationService.fetchAnimations(spriteId));

    const spriteDef: ISpriteDefinitionForGame = {
      id: sprite.id,
      name: sprite.name,
      width: sprite.width,
      height: sprite.height,
      groundPoint:
        sprite.groundPointX && sprite.groundPointY
          ? {
              x: sprite.groundPointX,
              y: sprite.groundPointY,
            }
          : null,
      animations: animations.map((i: ISpriteAnimation) => ({
        id: Number(i.id),
        name: i.name,
        default: i.default,
        groundPoint: i.groundPoint,
        collisionFrame: i.collisionFrame,
        layers: i.layers.map((l: ISpriteAnimationLayer) => ({
          layerId: Number(l.layerId),
          loop: l.loop,
          speed: l.speed,
        })),
      })),
      layers: [],
    };
    const fileListMap: Map<string, number> = new Map();
    const filesList: IFileInfo[] = [];
    let fileIdx = 0;
    for (const layer of layers) {
      if (layer.id === 100) {
        debugger;
      }
      let fileId;
      const frames: number[] = [];
      for (const frame of layer.frames) {
        const fp = layer.flipHorizontal ? 'true' : 'false';
        const fv = layer.flipHorizontal ? 'true' : 'false';
        const key = `${frame.frameId}-${fp}-${fv}`;
        if (fileListMap.has(key)) {
          fileId = fileListMap.get(key) as number;
        } else {
          const frameFile = await this.generateFrameFile(
            frame,
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
          filesList.push({
            id: fileId,
            width: sprite.width,
            height: sprite.height,
            file: frameFile,
          });
          fileListMap.set(key, fileId);
        }
        frames.push(fileId);
      }
      const layerInfo = {
        id: layer.id,
        name: layer.name,
        x: layer.x,
        y: layer.y,
        zIndex: layer.zIndex,
        frames,
      };
      spriteDef.layers.push(layerInfo);
    }
    const filesMap: Map<number, IFileInfo> = new Map();
    filesList.forEach((i: IFileInfo) => filesMap.set(i.id, { ...i }));
    const nodes: IPackerNode[] = filesList.map((i: IFileInfo) => ({
      w: i.width,
      h: i.height,
      id: i.id,
    }));
    const texturePacker = new TexturePacker(TEXTURE_PACKER_WIDTH, TEXTURE_PACKER_HEIGHT);
    texturePacker.fit(nodes);
    const framesDef: {
      frameId: number;
      rect: IRect;
    }[] = [];
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
        console.error(`No Node.FIT ${node.id}`);
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
      await CanvasHelper.drawFileOnCanvas(
        canvas,
        Number(node.fit?.x),
        Number(node.fit?.y),
        node.w,
        node.h,
        fileInfo.file,
      );
    }

    const definitionFrame: IFramesDefinition[] = [
      {
        textureName: 'texture.png',
        frames: framesDef,
      },
    ];

    const spriteName = StringHelper.replaceHyphen(sprite.name.replace(/ /g, '-'));
    let definitionFile = `enum ${spriteName}AnimationEnum {\n`;
    animations.forEach((i: ISpriteAnimation) => {
      const name = StringHelper.replaceHyphen(i.name.replace(/ /g, '-'));
      definitionFile += `  ${StringHelper.lowerCaseFirstLetter(name)} = ${i.id},\n`;
    });
    definitionFile += '}\n';

    const filename = sprite.name.toLowerCase().replace(/ /g, '-') + ' (sprite-pack-for-game)';
    const zip = new JSZip();
    zip.file('definitions.ts', definitionFile);
    zip.file('sprite-def.json', JSON.stringify(spriteDef, null, 2));
    zip.file('frames-def.json', JSON.stringify(definitionFrame, null, 2));
    const blob = await CanvasHelper.canvasToBlob(canvas);
    const pngFile = new File([blob], 'texture.png');
    zip.file('texture.png', pngFile);

    const base64 = await zip.generateAsync({ type: 'base64' });
    const blobSrc = new Blob([StringHelper.base64ToUint8(base64)], {
      type: 'data:application/zip;base64',
    });
    const url = URL.createObjectURL(blobSrc);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.zip`);
    link.click();
  }

  public async exportSpritePack(spriteId: number): Promise<void> {
    const sprite = await lastValueFrom(this.spritesService.get(spriteId));
    const layers = await lastValueFrom(this.spriteLayersService.getListWithFrames(spriteId));
    const animations = await lastValueFrom(this.spritesAnimationService.fetchAnimations(spriteId));
    const spriteDef: ISpriteDefinition = {
      id: sprite.id,
      name: sprite.name,
      width: sprite.width,
      height: sprite.height,
      groundPointX: sprite.groundPointX ?? null,
      groundPointY: sprite.groundPointY ?? null,
      animations: animations.map((i: ISpriteAnimation) => ({
        id: i.id,
        name: i.name,
        default: i.default,
        groundPoint: i.groundPoint,
        collisionFrame: i.collisionFrame,
        layers: i.layers,
      })),
      layers: [],
    };

    const filesList: IFileInfo[] = [];
    for (const layer of layers) {
      const frames: ISpriteFrameDefinition[] = [];
      for (const frame of layer.frames) {
        filesList.push({
          id: frame.frameId,
          width: frame.width,
          height: frame.height,
          file: frame.file,
        });
        frames.push({
          fileId: frame.frameId,
          x: frame.x,
          y: frame.y,
          height: frame.height,
          width: frame.width,
          zIndex: frame.zIndex,
        });
      }
      const layerInfo: ISpriteLayerDefinition = {
        id: layer.id,
        name: layer.name,
        x: layer.x,
        y: layer.y,
        zIndex: layer.zIndex,
        flipHorizontal: layer.flipHorizontal ?? false,
        flipVertical: layer.flipVertical ?? false,
        frames,
      };
      spriteDef.layers.push(layerInfo);
    }

    const filesMap: Map<number, IFileInfo> = new Map();
    filesList.forEach((i: IFileInfo) => filesMap.set(i.id, { ...i }));
    const nodes: IPackerNode[] = filesList.map((i: IFileInfo) => ({
      w: i.width,
      h: i.height,
      id: i.id,
    }));
    const texturePacker = new TexturePacker(TEXTURE_PACKER_WIDTH, TEXTURE_PACKER_HEIGHT);
    texturePacker.fit(nodes);
    const framesDef: {
      frameId: number;
      rect: IRect;
    }[] = [];
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
        console.error(`No Node.FIT ${node.id}`);
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
      await CanvasHelper.drawFileOnCanvas(
        canvas,
        Number(node.fit?.x),
        Number(node.fit?.y),
        node.w,
        node.h,
        fileInfo.file,
      );
    }
    const definitionFrame: IFramesDefinition[] = [
      {
        textureName: 'texture.png',
        frames: framesDef,
      },
    ];

    const filename = sprite.name.toLowerCase().replace(/ /g, '-') + ' (export-sprite-pack)';
    const zip = new JSZip();
    zip.file('sprite-def.json', JSON.stringify(spriteDef, null, 2));
    zip.file('frames-def.json', JSON.stringify(definitionFrame, null, 2));
    const blob = await CanvasHelper.canvasToBlob(canvas);
    const pngFile = new File([blob], 'texture.png');
    zip.file('texture.png', pngFile);

    const base64 = await zip.generateAsync({ type: 'base64' });
    const blobSrc = new Blob([StringHelper.base64ToUint8(base64)], {
      type: 'data:application/zip;base64',
    });
    const url = URL.createObjectURL(blobSrc);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.zip`);
    link.click();
  }

  private async generateFrameFile(
    frame: ISpriteFrame,
    width: number,
    height: number,
    layerX: number,
    layerY: number,
    flipHorizontal: boolean,
    flipVertical: boolean,
  ): Promise<File | null> {
    let source: HTMLCanvasElement | null = await CanvasHelper.fileToCanvas(frame.file);
    if (flipHorizontal) {
      source = CanvasHelper.canvasFlipHorizontal(source);
      if (!source) {
        return null;
      }
    }
    if (flipVertical) {
      source = CanvasHelper.canvasFlipVertical(source);
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
    ctx.drawImage(source, layerX + frame.x, layerY + frame.y);
    const blob = await CanvasHelper.canvasToBlob(canvas);
    return new File([blob], frame.file.name);
  }
}
