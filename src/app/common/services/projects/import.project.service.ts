import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { lastValueFrom } from 'rxjs';

import { ZipHelper } from '../../helpers';
import {
  IFrame,
  IProject,
  IScene,
  ISceneObject,
  ISprite,
  ISpriteAnimation,
  ISpriteAnimationLayer,
  ISpriteAnimationLayerFrame,
  ISpriteFrame,
  ISpriteLayer,
  ITilesGrid,
  ITilesGridBg,
  ITilesGridItem,
  ITreeItem,
} from '../../interfaces';
import { FramesDBService, FramesTreeDBService } from '../frames';
import { ScenesDBService } from '../scenes/scenes.db.service';
import { ScenesObjectsDBService } from '../scenes/scenes-objects.db.service';
import { SpriteLayersDBService, SpritesDBService, SpritesTreeDBService } from '../sprites';
import { SpriteAnimationDBService } from '../sprites/sprite-animation.db.service';
import { SpriteFramesDBService } from '../sprites/sprite-frames.db.service';
import { TilesGridDBService } from '../tiles/tiles-grid.db.service';
import { TilesGridBgDBService } from '../tiles/tiles-grid-bg.db.service';
import { ProjectsService } from './project.service';

interface IFrameExt extends IFrame {
  zipFilename: string;
  filename: string;
}

interface ITilesGridBgExt extends ITilesGridBg {
  zipFilename: string;
  filename: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImportProjectService {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly framesTreeDBService: FramesTreeDBService,
    private readonly framesDBService: FramesDBService,
    private readonly spritesTreeDBService: SpritesTreeDBService,
    private readonly spritesDBService: SpritesDBService,
    private readonly spriteLayersDBService: SpriteLayersDBService,
    private readonly spriteFramesDBService: SpriteFramesDBService,
    private readonly spriteAnimationDBService: SpriteAnimationDBService,
    private readonly tilesGridDBService: TilesGridDBService,
    private readonly tilesGridBgDBService: TilesGridBgDBService,
    private readonly scenesDBService: ScenesDBService,
    private readonly scenesObjectsDBService: ScenesObjectsDBService,
  ) {}

  public async importProject(data: ArrayBuffer): Promise<number> {
    const zip = new JSZip();
    const zipData = await zip.loadAsync(data);
    const projectJson = await ZipHelper.getJSONFromZip<IProject>(zipData, 'projects.json');
    if (!projectJson) {
      throw new Error('Нет данных о проекте');
    }
    const project = await lastValueFrom(this.projectsService.add(projectJson.name));
    const projectId = project.id;
    const framesTreeJson = await ZipHelper.getJSONFromZip<ITreeItem[]>(zipData, 'frames-tree.json');
    const framesTreeMap: Map<number, number> = new Map();
    if (framesTreeJson) {
      await this.importTreeFrames(projectId, framesTreeJson, framesTreeMap);
    }
    const framesJson = await ZipHelper.getJSONFromZip<IFrameExt[]>(zipData, 'frames.json');
    const framesMap: Map<number, number> = new Map();
    if (framesJson) {
      await this.importFrames(projectId, framesJson, framesMap, framesTreeMap, zipData);
    }
    const spritesTreeJson = await ZipHelper.getJSONFromZip<ITreeItem[]>(zipData, 'sprites-tree.json');
    const spritesTreeMap: Map<number, number> = new Map();
    if (spritesTreeJson) {
      await this.importTreeSprites(projectId, spritesTreeJson, spritesTreeMap);
    }
    const spritesJson = await ZipHelper.getJSONFromZip<ISprite[]>(zipData, 'sprites.json');
    const spritesMap: Map<number, number> = new Map();
    if (spritesJson) {
      await this.importSprites(projectId, spritesJson, spritesMap, spritesTreeMap);
    }
    const spritesLayersJson = await ZipHelper.getJSONFromZip<ISpriteLayer[]>(zipData, 'sprites-layers.json');
    const spritesLayersMap: Map<number, number> = new Map();
    if (spritesLayersJson) {
      await this.importSpritesLayers(projectId, spritesLayersJson, spritesLayersMap, spritesMap);
    }
    const spritesFramesJson = await ZipHelper.getJSONFromZip<ISpriteFrame[]>(zipData, 'sprites-frames.json');
    const spritesFramesMap: Map<number, number> = new Map();
    if (spritesFramesJson) {
      await this.importSpritesFrames(
        projectId,
        spritesFramesJson,
        spritesMap,
        spritesLayersMap,
        framesMap,
        spritesFramesMap,
      );
    }
    const spritesAnimationsJson = await ZipHelper.getJSONFromZip<ISpriteAnimation[]>(
      zipData,
      'sprites-animations.json',
    );
    const spritesAnimationsMap: Map<number, number> = new Map();
    if (spritesAnimationsJson) {
      await this.importSpriteAnimations(
        projectId,
        spritesAnimationsJson,
        spritesLayersMap,
        spritesMap,
        spritesFramesMap,
        spritesAnimationsMap,
      );
    }
    const tilesGridJson = await ZipHelper.getJSONFromZip<ITilesGrid[]>(zipData, 'tiles-grid.json');
    const tilesGridMap: Map<number, number> = new Map();
    if (tilesGridJson) {
      await this.importTilesGrid(projectId, tilesGridJson, framesMap, tilesGridMap);
    }
    const tilesGridBgJson = await ZipHelper.getJSONFromZip<ITilesGridBgExt[]>(zipData, 'tiles-grid-bg.json');
    if (tilesGridBgJson) {
      await this.importTilesGridBg(projectId, tilesGridBgJson, tilesGridMap, zipData);
    }
    const scenesJson = await ZipHelper.getJSONFromZip<IScene[]>(zipData, 'scenes.json');
    const scenesMap: Map<number, number> = new Map();
    if (scenesJson) {
      await this.importScenes(projectId, scenesJson, scenesMap);
    }
    const scenesObjectsJson = await ZipHelper.getJSONFromZip<ISceneObject[]>(zipData, 'scenes-objects.json');
    if (scenesObjectsJson) {
      await this.importScenesObjects(
        projectId,
        scenesObjectsJson,
        scenesMap,
        spritesMap,
        tilesGridMap,
        spritesAnimationsMap,
      );
    }
    return projectId;
  }

  private async importScenesObjects(
    projectId: number,
    items: ISceneObject[],
    scenesMap: Map<number, number>,
    spritesMap: Map<number, number>,
    tilesGridMap: Map<number, number>,
    spritesAnimationsMap: Map<number, number>,
    parentId: number | null = null,
  ): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        const sceneId = scenesMap.get(item.sceneId) ?? null;
        if (!sceneId) {
          console.log('Import project pass scene object', item);
          continue;
        }
        const params: Partial<ISceneObject> = {
          projectId,
          sceneId,
          parentId,
          type: item.type,
          name: item.name,
          animationId: null,
          x: item.x,
          y: item.y,
          zIndex: item.zIndex,
          visible: item.visible,
          properties: item.properties,
          referenceId: null,
        };
        if (item.type === 'sprite' && item.referenceId) {
          if (spritesMap.has(item.referenceId)) {
            params.referenceId = spritesMap.get(item.referenceId);
            if (spritesAnimationsMap.has(Number(item.animationId))) {
              params.animationId = spritesAnimationsMap.get(Number(item.animationId));
              params.playing = item.playing;
            } else {
              console.log('Import project: scene object (sprite) - not animation', item);
              params.animationId = null;
              params.playing = false;
            }
          } else {
            console.log('Import project pass scene object (sprite)', item);
            continue;
          }
        }
        if (item.type === 'layer-grid' && item.referenceId) {
          if (tilesGridMap.has(item.referenceId)) {
            params.referenceId = tilesGridMap.get(item.referenceId);
          } else {
            console.log('Import project pass scene object (grid)', item);
            continue;
          }
        }
        if (item.type === 'ground' || item.type === 'event') {
          params.width = item.width;
          params.height = item.height;
        }
        const obj = await lastValueFrom(this.scenesObjectsDBService.insert(params));
        if (Array.isArray(item.children) && item.children.length > 0) {
          await this.importScenesObjects(
            projectId,
            item.children,
            scenesMap,
            spritesMap,
            tilesGridMap,
            spritesAnimationsMap,
            obj.id,
          );
        }
      }
    }
  }

  private async importScenes(projectId: number, items: IScene[], scenesMap: Map<number, number>): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        const scene = await lastValueFrom(
          this.scenesDBService.insert({
            projectId,
            name: item.name,
            width: item.width,
            height: item.height,
            offsetX: item.offsetX,
            offsetY: item.offsetY,
            actorX: item.actorX,
            actorY: item.actorY,
            actorLayerId: item.actorLayerId,
          }),
        );
        scenesMap.set(item.id, scene.id);
      }
    }
  }

  private async importTilesGridBg(
    projectId: number,
    items: ITilesGridBgExt[],
    tilesGridMap: Map<number, number>,
    zipData: JSZip,
  ): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        const file = await ZipHelper.getFileFromZip(zipData, item.zipFilename, item.filename);
        const gridId = tilesGridMap.get(item.gridId) ?? null;
        if (file && gridId) {
          await lastValueFrom(
            this.tilesGridBgDBService.insert({
              projectId,
              gridId,
              opacity: item.opacity,
              file,
            }),
          );
        } else {
          console.log('Import project pass tile grid bg', item);
        }
      }
    }
  }

  private async importTilesGrid(
    projectId: number,
    items: ITilesGrid[],
    framesMap: Map<number, number>,
    tilesGridMap: Map<number, number>,
  ): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        const gridItems: ITilesGridItem[] = [];
        for (const i of item.items) {
          const referenceId = framesMap.get(Number(i.referenceId));
          if (referenceId) {
            gridItems.push({ ...i, referenceId });
          } else {
            console.log('Import project pass tile grid', item, i);
          }
        }
        const grid = await lastValueFrom(
          this.tilesGridDBService.insert({
            projectId,
            name: item.name,
            mapInfo: item.mapInfo,
            tileInfo: item.tileInfo,
            items: gridItems,
          }),
        );
        tilesGridMap.set(item.id, grid.id);
      }
    }
  }

  private async importSpriteAnimations(
    projectId: number,
    items: ISpriteAnimation[],
    spritesLayersMap: Map<number, number>,
    spritesMap: Map<number, number>,
    spritesFramesMap: Map<number, number>,
    spritesAnimationsMap: Map<number, number>,
  ): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        const spriteId = spritesMap.get(item.spriteId) ?? null;
        if (!spriteId) {
          console.log('Import project pass sprite animation', item);
          continue;
        }
        const layers: ISpriteAnimationLayer[] = [];
        for (const layer of item.layers) {
          if (layer.layerId && spritesLayersMap.has(layer.layerId)) {
            layer.layerId = spritesLayersMap.get(layer.layerId) as number;
            layer.frames = layer.frames
              .filter((i: ISpriteAnimationLayerFrame) => spritesFramesMap.has(i.id))
              .map((i: ISpriteAnimationLayerFrame) => ({
                ...i,
                id: spritesFramesMap.get(i.id) as number,
              }));
            layers.push(layer);
          } else {
            console.log('Import project pass sprite animation layer', layer);
            continue;
          }
        }
        const animation = await lastValueFrom(
          this.spriteAnimationDBService.insert({
            projectId,
            spriteId,
            name: item.name,
            default: item.default,
            groundPoint: item.groundPoint,
            collisionFrame: item.collisionFrame,
            layers,
            order: item.order,
          }),
        );
        spritesAnimationsMap.set(item.id, animation.id);
      }
    }
  }

  private async importSpritesFrames(
    projectId: number,
    items: ISpriteFrame[],
    spritesMap: Map<number, number>,
    spritesLayersMap: Map<number, number>,
    framesMap: Map<number, number>,
    spritesFramesMap: Map<number, number>,
  ): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        const spriteId = spritesMap.get(item.spriteId) ?? null;
        const layerId = spritesLayersMap.get(item.layerId) ?? null;
        const frameId = framesMap.get(item.frameId) ?? null;
        if (!layerId || !frameId || !spriteId) {
          console.log('Import project pass sprite frame', item);
          continue;
        }
        const frame = await lastValueFrom(
          this.spriteFramesDBService.insert({
            projectId,
            spriteId,
            layerId,
            frameId,
            name: item.name,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            visible: item.visible,
            zIndex: item.zIndex,
            order: item.order,
          }),
        );
        spritesFramesMap.set(item.id, frame.id);
      }
    }
  }

  private async importSpritesLayers(
    projectId: number,
    items: ISpriteLayer[],
    spritesLayersMap: Map<number, number>,
    spritesMap: Map<number, number>,
  ): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        const spriteId = spritesMap.get(item.spriteId) ?? null;
        if (!spriteId) {
          console.log('Import project pass sprite layer', item);
          continue;
        }
        const layer = await lastValueFrom(
          this.spriteLayersDBService.insert({
            projectId,
            spriteId,
            name: item.name,
            visible: item.visible,
            x: item.x,
            y: item.y,
            zIndex: item.zIndex,
            bgColor: item.bgColor,
            flipHorizontal: item.flipHorizontal,
            flipVertical: item.flipVertical,
            order: item.order,
          }),
        );
        spritesLayersMap.set(item.id, layer.id);
      }
    }
  }

  private async importSprites(
    projectId: number,
    items: ISprite[],
    spritesMap: Map<number, number>,
    spritesTreeMap: Map<number, number>,
  ): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        let treeId: number | null = null;
        if (item.treeId) {
          treeId = spritesTreeMap.get(item.treeId) ?? null;
        }
        const sprite = await lastValueFrom(
          this.spritesDBService.insert({
            projectId,
            treeId,
            name: item.name,
            width: item.width,
            height: item.height,
            bgColor: item.bgColor,
            groundPointX: item.groundPointX,
            groundPointY: item.groundPointY,
            visibleGroundPoint: item.visibleGroundPoint,
          }),
        );
        spritesMap.set(item.id, sprite.id);
      }
    }
  }

  private async importTreeSprites(
    projectId: number,
    items: ITreeItem[],
    spritesTreeMap: Map<number, number>,
    parentId: number | null = null,
  ): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        const tree = await lastValueFrom(
          this.spritesTreeDBService.insert({
            projectId,
            parentId,
            name: item.name,
            order: item.order,
          }),
        );
        spritesTreeMap.set(item.id, tree.id);
        spritesTreeMap.set(item.id, tree.id);
        if (Array.isArray(item.children) && item.children.length > 0) {
          await this.importTreeSprites(projectId, item.children, spritesTreeMap, tree.id);
        }
      }
    }
  }

  private async importFrames(
    projectId: number,
    items: IFrameExt[],
    framesMap: Map<number, number>,
    framesTreeMap: Map<number, number>,
    zipData: JSZip,
  ): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        const file = await ZipHelper.getFileFromZip(zipData, item.zipFilename, item.filename);
        if (!file) {
          console.log('Import project pass frame', item);
          continue;
        }
        let treeId: number | null = null;
        if (item.treeId) {
          treeId = framesTreeMap.get(item.treeId) ?? null;
        }
        const frame = await lastValueFrom(this.framesDBService.add(projectId, treeId, file, item.name));
        framesMap.set(item.id, frame.id);
      }
    }
  }

  private async importTreeFrames(
    projectId: number,
    items: ITreeItem[],
    framesTreeMap: Map<number, number>,
    parentId: number | null = null,
  ): Promise<void> {
    if (Array.isArray(items)) {
      for (const item of items) {
        const tree = await lastValueFrom(
          this.framesTreeDBService.insert({
            projectId,
            parentId,
            name: item.name,
            order: item.order,
          }),
        );
        framesTreeMap.set(item.id, tree.id);
        if (Array.isArray(item.children) && item.children.length > 0) {
          await this.importTreeFrames(projectId, item.children, framesTreeMap, tree.id);
        }
      }
    }
  }
}
