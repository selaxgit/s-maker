/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { lastValueFrom } from 'rxjs';

import { IPackerNode, TexturePacker } from '../../classes';
import { CanvasHelper, FileHelper, StringHelper, TransformHelper } from '../../helpers';
import {
  IExportFrameDef,
  IFileInfo,
  IFrame,
  IFramesDefinition,
  IGridDefinition,
  IRect,
  ISceneDefinition,
  ISceneObject,
  ISceneObjectDefinition,
  ISprite,
  ISpriteAnimation,
  ISpriteAnimationLayer,
  ISpriteAnimationsDefinition,
  ISpriteDefinition,
  ISpriteFrame,
  ISpriteLayerDefinition,
  ISpriteLayersListItem,
  ITilesGrid,
  ITilesGridItem,
  TEXTURE_PACKER_HEIGHT,
  TEXTURE_PACKER_WIDTH,
} from '../../interfaces';
import { FramesService } from '../frames';
import { SpriteLayersService, SpritesService } from '../sprites';
import { SpritesAnimationService } from '../sprites/sprite-animation.service';
import { TilesGridService } from '../tiles';
import { ScenesService } from './scenes.service';

@Injectable({
  providedIn: 'root',
})
export class ExportSceneService {
  constructor(
    private readonly scenesService: ScenesService,
    private readonly tilesGridService: TilesGridService,
    private readonly framesService: FramesService,
    private readonly spritesService: SpritesService,
    private readonly spriteLayersService: SpriteLayersService,
    private readonly spritesAnimationService: SpritesAnimationService,
  ) {}

  public async exportScene(sceneId: number): Promise<void> {
    const defScene = await this.generateSceneDef(sceneId);
    const filename = defScene.name.toLowerCase().replace(/ /g, '-') + '.json';
    FileHelper.downloadJson(defScene, filename);
  }

  public async exportScenePack(sceneId: number): Promise<void> {
    const defScene = await this.generateSceneDef(sceneId);
    const defFrames = await this.generateSceneFrames(sceneId);
    const defGrids = await this.generateSceneLayersGrid(sceneId);
    const spritesDef = await this.generateSceneSpritesDef(sceneId);
    const sceneName = defScene.name.toLowerCase().replace(/ /g, '-') + ' (scene-pack)';
    const zip = new JSZip();
    zip.file('scene-def.json', JSON.stringify(defScene, null, 2));
    zip.file('layers-grid-def.json', JSON.stringify(defGrids, null, 2));
    zip.file('sprites-def.json', JSON.stringify(spritesDef, null, 2));
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

    const base64 = await zip.generateAsync({ type: 'base64' });
    const blobSrc = new Blob([StringHelper.base64ToUint8(base64)], {
      type: 'data:application/zip;base64',
    });
    const url = URL.createObjectURL(blobSrc);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${sceneName}.zip`);
    link.click();
  }

  private async generateSceneDef(sceneId: number): Promise<ISceneDefinition> {
    const scene = await lastValueFrom(this.scenesService.getScene(sceneId));
    const packInfo: ISceneDefinition = {
      name: scene.name,
      width: scene.width,
      height: scene.height,
      offsetX: scene.offsetX,
      offsetY: scene.offsetY,
      actorX: scene.actorX,
      actorY: scene.actorY,
      actorLayerId: scene.actorLayerId,
      ground: [],
      objects: [],
      events: [],
    };
    const objects = await lastValueFrom(this.scenesService.getSceneObjectTreeList(sceneId));
    for (const obj of objects) {
      switch (obj.type) {
        case 'layer-ground':
          packInfo.ground.push(
            ...(obj.children || []).map((child: ISceneObject) => ({
              x: child.x ?? 0,
              y: child.y ?? 0,
              width: child.width ?? 0,
              height: child.height ?? 0,
            })),
          );
          break;
        case 'layer-events':
          packInfo.events.push(
            ...(obj.children || []).map((child: ISceneObject) => ({
              rect: {
                x: child.x ?? 0,
                y: child.y ?? 0,
                width: child.width ?? 0,
                height: child.height ?? 0,
              },
              properties: TransformHelper.propertiesToFlat(child.properties ?? {}),
            })),
          );
          break;
        case 'layer-grid':
        case 'layer-sprites':
          const pObj: ISceneObjectDefinition = {
            id: obj.id,
            name: obj.name,
            type: obj.type,
            x: obj.x ?? 0,
            y: obj.x ?? 0,
            zIndex: obj.zIndex ?? 0,
            visible: obj.visible,
            externalId: obj.referenceId ?? null,
            children: [],
          };
          if (obj.type === 'layer-sprites') {
            pObj.children = (obj.children || []).map((child: ISceneObject) => ({
              id: child.id,
              name: child.name,
              type: child.type,
              visible: child.visible,
              externalId: child.referenceId ?? null,
              animationId: child.animationId ?? null,
              playing: child.playing ?? false,
              x: child.x ?? 0,
              y: child.y ?? 0,
              zIndex: child.zIndex ?? 0,
              properties: TransformHelper.propertiesToFlat(child.properties ?? {}),
            }));
          }
          packInfo.objects.push(pObj);
          break;
      }
    }
    return packInfo;
  }

  private async generateSceneFrames(sceneId: number): Promise<IExportFrameDef[]> {
    const ret: IExportFrameDef[] = [];
    let filesList = await this.getSceneFrames(sceneId);
    const filesMap: Map<number, IFileInfo> = new Map();
    filesList.forEach((i: IFileInfo) => filesMap.set(i.id, { ...i }));
    const maxWidth = filesList.reduce((acc: number, curr: IFileInfo) => (acc > curr.width ? acc : curr.width), 0);
    const maxHeight = filesList.reduce((acc: number, curr: IFileInfo) => (acc > curr.height ? acc : curr.height), 0);
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
      ret.push({
        definition,
        canvas,
      });
      filesList = filesList.filter((i: IFileInfo) => fids.includes(i.id));
    }

    return ret;
  }

  private async getSceneFrames(sceneId: number): Promise<IFileInfo[]> {
    const sceneObjects = await lastValueFrom(
      this.scenesService.fetchScenesObjectsByFilter(
        (i: ISceneObject) => ['sprite', 'layer-grid'].includes(i.type) && i.sceneId === sceneId,
      ),
    );
    const filesList: IFileInfo[] = [];
    const layersGrid = sceneObjects.filter((i: ISceneObject) => i.type === 'layer-grid');
    const layersSprites = sceneObjects.filter((i: ISceneObject) => i.type === 'sprite');
    const filesIds: number[] = [];
    for (const layerGrid of layersGrid) {
      if (!layerGrid.referenceId) {
        continue;
      }
      const grid = await lastValueFrom(this.tilesGridService.getTileGrid(layerGrid.referenceId));
      grid.items.forEach((i: ITilesGridItem) => {
        if (i.referenceId) {
          filesIds.push(i.referenceId);
        }
      });
    }
    const files = await lastValueFrom(this.framesService.fetchByFilter((i: IFrame) => filesIds.includes(i.id)));
    files.forEach((i: IFrame) =>
      filesList.push({
        id: i.id,
        width: i.width,
        height: i.height,
        file: i.file,
      }),
    );
    const spritesIds = layersSprites.map((i: ISceneObject) => i.referenceId);
    const layers = await lastValueFrom(
      this.spriteLayersService.getListWithFramesByFilter((i: { spriteId: number }) => spritesIds.includes(i.spriteId)),
    );
    for (const layer of layers) {
      for (const frame of layer.frames) {
        const item = {
          id: frame.frameId,
          width: frame.width,
          height: frame.height,
          file: frame.file,
        };
        filesList.push(item);
      }
    }
    return filesList;
  }

  private async generateSceneLayersGrid(sceneId: number): Promise<IGridDefinition[]> {
    const objects = await lastValueFrom(
      this.scenesService.fetchScenesObjectsByFilter(
        (i: ISceneObject) => i.type === 'layer-grid' && i.sceneId === sceneId,
      ),
    );
    const ids = objects.map((i: ISceneObject) => i.referenceId);
    if (!ids) {
      return [];
    }
    const grids: any = await lastValueFrom(
      this.tilesGridService.fetchTilesGridsByFilter((i: ITilesGrid) => ids.includes(i.id)),
    );
    for (const grid of grids) {
      delete grid.projectId;
      (grid.items || []).forEach((i: any) => {
        i.properties = TransformHelper.propertiesToFlat(i.properties ?? {});
      });
    }
    return grids as IGridDefinition[];
  }

  private async generateSceneSpritesDef(sceneId: number): Promise<ISpriteDefinition[]> {
    const packInfo: ISpriteDefinition[] = [];
    const objects = await lastValueFrom(
      this.scenesService.fetchScenesObjectsByFilter((i: ISceneObject) => i.type === 'sprite' && i.sceneId === sceneId),
    );
    const spritesIds = objects.map((i: ISceneObject) => i.referenceId);
    const sprites = await lastValueFrom(this.spritesService.fetchByFilter((i: ISprite) => spritesIds.includes(i.id)));
    const layers = await lastValueFrom(
      this.spriteLayersService.getListWithFramesByFilter((i: { spriteId: number }) => spritesIds.includes(i.spriteId)),
    );
    const animations = await lastValueFrom(
      this.spritesAnimationService.fetchAnimationsByFilter((i: ISpriteAnimation) => spritesIds.includes(i.spriteId)),
    );
    for (const sprite of sprites) {
      const spriteDef: ISpriteDefinition = {
        id: sprite.id,
        name: sprite.name,
        width: sprite.width,
        height: sprite.height,
        groundPointX: sprite.groundPointX ?? null,
        groundPointY: sprite.groundPointY ?? null,
        animations: animations
          .filter((i: ISpriteAnimation) => i.spriteId === sprite.id)
          .map((i: ISpriteAnimation) => ({
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
          })) as ISpriteAnimationsDefinition[],
        layers: [],
      };
      const spriteLayers = layers.filter((i: ISpriteLayersListItem) => i.spriteId === sprite.id);
      for (const layer of spriteLayers) {
        const layerInfo: ISpriteLayerDefinition = {
          id: layer.id,
          name: layer.name,
          x: layer.x,
          y: layer.y,
          zIndex: layer.zIndex,
          flipHorizontal: layer.flipHorizontal ?? false,
          flipVertical: layer.flipVertical ?? false,
          frames: layer.frames.map((i: ISpriteFrame) => ({
            fileId: i.frameId,
            x: i.x,
            y: i.y,
            height: i.height,
            width: i.width,
            zIndex: i.zIndex,
          })),
        };
        spriteDef.layers.push(layerInfo);
      }
      packInfo.push(spriteDef);
    }
    return packInfo;
  }
}
