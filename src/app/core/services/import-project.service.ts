import { inject, Injectable } from '@angular/core';
import { SUVersionHelper } from '@selax/utils';
import JSZip from 'jszip';
import { lastValueFrom } from 'rxjs';

import { SceneLayerTypeEnum } from '~core/constants';
import { DBFrames, DBFramesTree, DBGrid, DBProjects, DBScenes, DBSprites, DBSpritesTree } from '~core/db';
import {
  IFrame,
  IProject,
  IScene,
  ISceneLayer,
  ISceneObjectSprite,
  ISMVersion,
  ISprite,
  ISpriteFrame,
  ISpriteLayer,
  ITilesGrid,
  ITilesGridItem,
  SceneObjectType,
} from '~core/interfaces';
import { ZipHelper } from '~helpers/zip.helper';
import { ITreeItem } from '~interfaces/tree.interface';

interface IFrameExt extends IFrame {
  zipFilename: string;
  filename: string;
  filetype: string;
}

interface ITilesGridExt extends ITilesGrid {
  zipBackgroundFilename: string;
  backgroundFilename: string;
  backgroundFiletype: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImportProjectService {
  private readonly dbProjects = inject(DBProjects);

  private readonly dbFramesTree = inject(DBFramesTree);

  private readonly dbFrames = inject(DBFrames);

  private readonly dbSpritesTree = inject(DBSpritesTree);

  private readonly dbSprites = inject(DBSprites);

  private readonly dbGrid = inject(DBGrid);

  private readonly dbScenes = inject(DBScenes);

  private errorsLog: string[] = [];

  getErrorsLogs(): string[] {
    return this.errorsLog;
  }

  async importProject(data: ArrayBuffer): Promise<number> {
    this.errorsLog = [];
    const zip = new JSZip();
    const zipData = await zip.loadAsync(data);
    const versionJson = await ZipHelper.getJSONFromZip<ISMVersion>(zipData, 'version.json');
    if (versionJson?.smVersion) {
      if (SUVersionHelper.satisfies(versionJson.smVersion, '^5.0.0')) {
        return this.importCurrentVersion(zipData);
      }
    }
    throw new Error('Несовместимая версия файла импорта');
  }

  private async importCurrentVersion(zipData: JSZip): Promise<number> {
    const projectJson = await ZipHelper.getJSONFromZip<IProject>(zipData, 'project.json');
    if (!projectJson) {
      throw new Error('Нет данных о проекте');
    }
    const project = await lastValueFrom(this.dbProjects.insert({ name: projectJson.name }));
    const projectId = project.id;
    const framesTreeMap = new Map<number, number>();
    const framesMap = new Map<number, number>();
    const spritesTreeMap = new Map<number, number>();
    const spritesMap = new Map<number, number>();
    const gridsdMap = new Map<number, number>();

    const framesTreeJson = await ZipHelper.getJSONFromZip<ITreeItem[]>(zipData, 'frames-tree.json');
    if (framesTreeJson) {
      await this.importCVTreeFrames(projectId, framesTreeJson, framesTreeMap);
    }
    const framesJson = await ZipHelper.getJSONFromZip<IFrameExt[]>(zipData, 'frames.json');
    if (framesJson) {
      await this.importCVFrames(projectId, framesJson, framesMap, framesTreeMap, zipData);
    }
    const spritesTreeJson = await ZipHelper.getJSONFromZip<ITreeItem[]>(zipData, 'sprites-tree.json');
    if (spritesTreeJson) {
      await this.importCVTreeSprites(projectId, spritesTreeJson, spritesTreeMap);
    }
    const spritesJson = await ZipHelper.getJSONFromZip<ISprite[]>(zipData, 'sprites.json');
    if (spritesJson) {
      await this.importCVSprites(projectId, spritesJson, spritesMap, spritesTreeMap, framesMap);
    }
    const gridsJson = await ZipHelper.getJSONFromZip<ITilesGridExt[]>(zipData, 'grid.json');
    if (gridsJson) {
      await this.importCVGrid(projectId, gridsJson, framesMap, gridsdMap, zipData);
    }
    const scenesJson = await ZipHelper.getJSONFromZip<IScene[]>(zipData, 'scenes.json');
    if (scenesJson) {
      await this.importCVScenes(projectId, scenesJson, spritesMap, gridsdMap);
    }
    return projectId;
  }

  private async importCVScenes(
    projectId: number,
    items: IScene[],
    spritesMap: Map<number, number>,
    gridsdMap: Map<number, number>,
  ): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        await lastValueFrom(
          this.dbScenes.insert({
            projectId,
            name: item.name,
            width: item.width,
            height: item.height,
            offsetX: item.offsetX,
            offsetY: item.offsetY,
            layers: item.layers.map((layer: ISceneLayer) => {
              switch (layer.type) {
                case SceneLayerTypeEnum.Grids:
                  layer.referenceGridId = layer.referenceGridId ? gridsdMap.get(layer.referenceGridId) : undefined;
                  return { ...layer };
                case SceneLayerTypeEnum.Sprites:
                  layer.objects.map((obj: SceneObjectType) => {
                    const referenceId = (obj as ISceneObjectSprite).referenceId
                      ? (spritesMap.get((obj as ISceneObjectSprite).referenceId!) ?? null)
                      : null;
                    if (!referenceId) {
                      this.errorsLog.push(`Scene: ${item.name}, sprite: ${obj.name}`);
                    }
                    return { ...obj, referenceId };
                  });
                  return { ...layer };
                default:
                  return { ...layer };
              }
            }),
          }),
        );
      }
    }
  }

  private async importCVGrid(
    projectId: number,
    grids: ITilesGridExt[],
    framesMap: Map<number, number>,
    gridsdMap: Map<number, number>,
    zipData: JSZip,
  ): Promise<void> {
    if (Array.isArray(grids)) {
      for (const grid of grids) {
        const file = await ZipHelper.getFileFromZip(
          zipData,
          grid.zipBackgroundFilename,
          grid.backgroundFilename,
          grid.backgroundFiletype,
        );
        const newGrid = await lastValueFrom(
          this.dbGrid.insert({
            projectId,
            name: grid.name,
            mapInfo: grid.mapInfo,
            tileInfo: grid.tileInfo,
            background: {
              opacity: grid.background.opacity,
              file: file ?? null,
            },
            items: grid.items
              .map((i: ITilesGridItem) => ({
                ...i,
                frameId: framesMap.get(i.frameId) ?? -1,
              }))
              .filter((frame: ITilesGridItem) => {
                if (frame.frameId > 0) {
                  return true;
                } else {
                  this.errorsLog.push(`Grid: ${grid.name}, frame: ${frame.x}x${frame.y}`);
                  return false;
                }
              }),
          }),
        );
        gridsdMap.set(grid.id, newGrid.id);
      }
    }
  }

  private async importCVSprites(
    projectId: number,
    items: ISprite[],
    spritesMap: Map<number, number>,
    spritesTreeMap: Map<number, number>,
    framesMap: Map<number, number>,
  ): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        let treeId: number | null = null;
        if (item.treeId) {
          treeId = spritesTreeMap.get(item.treeId) ?? null;
        }
        const sprite = await lastValueFrom(
          this.dbSprites.insert({
            projectId,
            treeId,
            name: item.name,
            width: item.width,
            height: item.height,
            bgColor: item.bgColor,
            groundPointX: item.groundPointX,
            groundPointY: item.groundPointY,
            visibleGroundPoint: item.visibleGroundPoint,
            animations: item.animations,
            layers: item.layers.map((l: ISpriteLayer) => ({
              ...l,
              frames: l.frames
                .map((f: ISpriteFrame) => ({
                  ...f,
                  frameId: framesMap.get(f.frameId) ?? -1,
                }))
                .filter((frame: ISpriteFrame) => {
                  if (frame.frameId > 0) {
                    return true;
                  } else {
                    this.errorsLog.push(`Sprite: ${item.name}, layer: ${l.name}, frame: ${frame.name}`);
                    return false;
                  }
                }),
            })),
          }),
        );
        spritesMap.set(item.id, sprite.id);
      }
    }
  }

  private async importCVTreeSprites(
    projectId: number,
    items: ITreeItem[],
    spritesTreeMap: Map<number, number>,
    parentId: number | null = null,
  ): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        const tree = await lastValueFrom(
          this.dbSpritesTree.insert({
            projectId,
            parentId,
            name: item.name,
            order: item.order,
          }),
        );
        spritesTreeMap.set(item.id, tree.id);
        spritesTreeMap.set(item.id, tree.id);
        if (Array.isArray(item.children) && item.children.length > 0) {
          await this.importCVTreeSprites(projectId, item.children, spritesTreeMap, tree.id);
        }
      }
    }
  }

  private async importCVFrames(
    projectId: number,
    items: IFrameExt[],
    framesMap: Map<number, number>,
    framesTreeMap: Map<number, number>,
    zipData: JSZip,
  ): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        const file = await ZipHelper.getFileFromZip(zipData, item.zipFilename, item.filename, item.filetype);
        if (!file) {
          this.errorsLog.push(`Frame: ${item.name}`);
          continue;
        }
        let treeId: number | null = null;
        if (item.treeId) {
          treeId = framesTreeMap.get(item.treeId) ?? null;
        }
        const frame = await lastValueFrom(this.dbFrames.add(projectId, treeId, file, item.name));
        framesMap.set(item.id, frame.id);
      }
    }
  }

  private async importCVTreeFrames(
    projectId: number,
    items: ITreeItem[],
    framesTreeMap: Map<number, number>,
    parentId: number | null = null,
  ): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        const tree = await lastValueFrom(
          this.dbFramesTree.insert({
            projectId,
            parentId,
            name: item.name,
            order: item.order,
          }),
        );
        framesTreeMap.set(item.id, tree.id);
        if (Array.isArray(item.children) && item.children.length > 0) {
          await this.importCVTreeFrames(projectId, item.children, framesTreeMap, tree.id);
        }
      }
    }
  }
}
