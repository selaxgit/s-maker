import {
  ISUPackerNode,
  ISURect,
  SUCanvasHelper,
  SUJsonHelper,
  SUNumberHelper,
  SUTexturePacker,
  TEXTURE_PACKER_HEIGHT,
  TEXTURE_PACKER_WIDTH,
} from '@selax/utils';

import { SceneLayerTypeEnum } from '~core/constants';
import {
  IExportFrameDef,
  IExportScene,
  IExportSceneEventsGround,
  IExportSprite,
  IExportSpriteLayer,
  IExportTilesGrid,
  IFrame,
  IScene,
  ISceneLayer,
  ISceneObjectEventsGround,
  ISprite,
  ISpriteAnimation,
  ISpriteAnimationLayer,
  ISpriteFrame,
  ISpriteLayer,
  ITilesGrid,
  ITilesGridItem,
  SceneObjectType,
} from '~core/interfaces';

import { TransformHelper } from './transform.helper';
import { UtilsHelper } from './utils.helper';

interface IFileInfo {
  id: number;
  width: number;
  height: number;
  file: File;
}

interface ISpriteFramesDefinitionInfo {
  framesDef: IExportFrameDef[];
  layers: IExportSpriteLayer[];
}

const reduceEventsGround = (acc: IExportSceneEventsGround[], layer: ISceneLayer): IExportSceneEventsGround[] => {
  const objects = layer.objects.reduce((events: IExportSceneEventsGround[], obj: SceneObjectType) => {
    const object = obj as ISceneObjectEventsGround;
    events.push({
      rect: {
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
      },
      properties:
        object.properties && !UtilsHelper.isEmptyObject(object.properties)
          ? TransformHelper.propertiesToFlat(object.properties)
          : null,
    });
    return events;
  }, []);
  acc.push(...objects);
  return acc;
};

export class ExportHelper {
  static async getSpriteFramesDefinitionInfo(
    framesList: IFrame[],
    sprite: ISprite,
    errorsLog: string[] = [],
  ): Promise<ISpriteFramesDefinitionInfo> {
    const framesMap = new Map<number, IFrame>();
    for (const item of framesList) {
      framesMap.set(item.id, item);
    }
    const fileListMap = new Map<string, number>();
    const filesList = new Map<number, IFileInfo>();
    let fileIdx = 0;
    const layers: IExportSpriteLayer[] = [];
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
          const frameFile = await ExportHelper.generateSpriteFrameFile(
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
          filesList.set(fileId, {
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
        zIndex: layer.zIndex,
        frames: [...framesIds],
      });
    }
    const framesDef: IExportFrameDef[] = [];
    while (filesList.size > 0) {
      const nodes: ISUPackerNode[] = [];
      for (const item of filesList.values()) {
        nodes.push({
          w: item.width,
          h: item.height,
          id: item.id,
        });
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
        const fileInfo = filesList.get(Number(node.id));
        if (!fileInfo) {
          errorsLog.push(`No Node FileInfo ${node.id}`);
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
      for (const key of filesList.keys()) {
        if (!fids.includes(key)) {
          filesList.delete(key);
        }
      }
    }
    return {
      framesDef,
      layers,
    };
  }

  static spriteToDefinition(sprite: ISprite, setId?: number): IExportSprite {
    return {
      id: setId,
      width: sprite.width,
      height: sprite.height,
      groundPoint:
        SUNumberHelper.isNumber(sprite.groundPointX) && SUNumberHelper.isNumber(sprite.groundPointY)
          ? { x: sprite.groundPointX!, y: sprite.groundPointY! }
          : null,
      layers: sprite.layers.map((layer: ISpriteLayer) => ({
        guid: layer.guid,
        zIndex: layer.zIndex,
        frames: layer.frames.map((frame: ISpriteFrame) => frame.frameId),
      })),
      animations: sprite.animations.map((animation: ISpriteAnimation) => ({
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
  }

  static gridToDefinition(grid: ITilesGrid, setId?: number): IExportTilesGrid {
    const gridDef = SUJsonHelper.clone(grid);
    gridDef.id = setId;
    gridDef.projectId = undefined;
    gridDef.name = undefined;
    gridDef.background = undefined;
    gridDef.items = grid.items.map((item: ITilesGridItem) => ({
      ...item,
      properties:
        item.properties && !UtilsHelper.isEmptyObject(item.properties)
          ? TransformHelper.propertiesToFlat(item.properties)
          : null,
    }));
    return gridDef;
  }

  static sceneToDefinition(scene: IScene): IExportScene {
    const sceneDef = SUJsonHelper.clone(scene);
    sceneDef.id = undefined;
    sceneDef.projectId = undefined;
    sceneDef.params = {
      width: sceneDef.width,
      height: sceneDef.height,
      offsetX: sceneDef.offsetX,
      offsetY: sceneDef.offsetY,
    };
    sceneDef.width = undefined;
    sceneDef.height = undefined;
    sceneDef.offsetX = undefined;
    sceneDef.offsetY = undefined;
    sceneDef.layers = scene.layers
      .filter((layer: ISceneLayer) => [SceneLayerTypeEnum.Grids, SceneLayerTypeEnum.Sprites].includes(layer.type))
      .map((layer: ISceneLayer) => ({
        ...layer,
        name: undefined,
        properties:
          layer.properties && !UtilsHelper.isEmptyObject(layer.properties)
            ? TransformHelper.propertiesToFlat(layer.properties)
            : null,
        objects: layer.objects.map((object: SceneObjectType) => ({
          ...object,
          name: undefined,
          properties:
            object.properties && !UtilsHelper.isEmptyObject(object.properties)
              ? TransformHelper.propertiesToFlat(object.properties)
              : null,
        })),
      }));
    sceneDef.events = scene.layers
      .filter((layer: ISceneLayer) => layer.type === SceneLayerTypeEnum.Events)
      .reduce(reduceEventsGround, []);
    sceneDef.grounds = scene.layers
      .filter((layer: ISceneLayer) => layer.type === SceneLayerTypeEnum.Grounds)
      .reduce(reduceEventsGround, []);
    return sceneDef;
  }

  static async getFramesDefinitionInfo(framesList: IFrame[], errorsLog: string[] = []): Promise<IExportFrameDef[]> {
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
          errorsLog.push(`No Node FileInfo ${node.id}`);
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

  static async generateSpriteFrameFile(
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
}
