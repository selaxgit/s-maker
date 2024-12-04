import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { lastValueFrom } from 'rxjs';

import { StringHelper } from '../../helpers';
import {
  IDBTreeItem,
  IFrame,
  IScene,
  ISceneObject,
  ISprite,
  ISpriteAnimation,
  ISpriteFrame,
  ISpriteLayer,
  ITilesGrid,
  ITilesGridBg,
} from '../../interfaces';
import { FramesDBService, FramesTreeDBService } from '../frames';
import { ScenesService } from '../scenes';
import { ScenesDBService } from '../scenes/scenes.db.service';
import { SpriteLayersDBService, SpritesDBService, SpritesTreeDBService } from '../sprites';
import { SpriteAnimationDBService } from '../sprites/sprite-animation.db.service';
import { SpriteFramesDBService } from '../sprites/sprite-frames.db.service';
import { TilesGridDBService } from '../tiles/tiles-grid.db.service';
import { TilesGridBgDBService } from '../tiles/tiles-grid-bg.db.service';
import { ProjectsService } from './project.service';

@Injectable({
  providedIn: 'root',
})
export class ExportProjectService {
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
    private readonly scenesService: ScenesService,
  ) {}

  public async exportProject(projectId: number): Promise<void> {
    const project = await lastValueFrom(this.projectsService.get(projectId));
    const treeFrames = await lastValueFrom(
      this.framesTreeDBService.getListWithChild((i: IDBTreeItem) => i.projectId === projectId),
    );
    const frames = await lastValueFrom(this.framesDBService.getListByFilter((i: IFrame) => i.projectId === projectId));
    const spritesTree = await lastValueFrom(
      this.spritesTreeDBService.getListWithChild((i: IDBTreeItem) => i.projectId === projectId),
    );
    const sprites = await lastValueFrom(
      this.spritesDBService.getListByFilter((i: ISprite) => i.projectId === projectId),
    );
    const spritesLayers = await lastValueFrom(
      this.spriteLayersDBService.getListByFilter((i: ISpriteLayer) => i.projectId === projectId),
    );
    const spritesFrames = await lastValueFrom(
      this.spriteFramesDBService.getListByFilter((i: ISpriteFrame) => i.projectId === projectId),
    );
    const spritesAnimations = await lastValueFrom(
      this.spriteAnimationDBService.getListByFilter((i: ISpriteAnimation) => i.projectId === projectId),
    );

    const tilesGrid = await lastValueFrom(
      this.tilesGridDBService.getListByFilter((i: ITilesGrid) => i.projectId === projectId),
    );
    const tilesGridBg = await lastValueFrom(
      this.tilesGridBgDBService.getListByFilter((i: ITilesGridBg) => i.projectId === projectId),
    );
    const scenes = await lastValueFrom(this.scenesDBService.getListByFilter((i: IScene) => i.projectId === projectId));
    const scenesObjects = await lastValueFrom(
      this.scenesService.getSceneObjectTreeListByFilter((i: ISceneObject) => i.projectId === projectId),
    );

    const jsoFrames = frames.map((i: IFrame) => ({
      height: i.height,
      id: i.id,
      name: i.name,
      projectId: i.projectId,
      treeId: i.treeId,
      width: i.width,
      zipFilename: `${i.id}.png`,
      filename: i.file.name,
    }));

    const jsonTilesGridBg = tilesGridBg.map((i: ITilesGridBg) => ({
      id: i.id,
      projectId: i.projectId,
      gridId: i.gridId,
      opacity: i.opacity,
      zipFilename: `${i.file.name}-${i.gridId}x${i.projectId}.png`,
      filename: i.file.name,
    }));

    const zip = new JSZip();
    zip.file('projects.json', JSON.stringify(project));
    zip.file('frames-tree.json', JSON.stringify(treeFrames));
    zip.file('frames.json', JSON.stringify(jsoFrames));
    zip.file('sprites-tree.json', JSON.stringify(spritesTree));
    zip.file('sprites.json', JSON.stringify(sprites));
    zip.file('sprites-layers.json', JSON.stringify(spritesLayers));
    zip.file('sprites-frames.json', JSON.stringify(spritesFrames));
    zip.file('sprites-animations.json', JSON.stringify(spritesAnimations));
    zip.file('tiles-grid.json', JSON.stringify(tilesGrid));
    zip.file('tiles-grid-bg.json', JSON.stringify(jsonTilesGridBg));
    zip.file('scenes.json', JSON.stringify(scenes));
    zip.file('scenes-objects.json', JSON.stringify(scenesObjects));

    for (const item of frames) {
      const blob = new Blob([item.file], { type: 'image/png' });
      const filename = `${item.id}.png`;
      zip.file(filename, new File([blob], filename));
    }
    for (const item of tilesGridBg) {
      const blob = new Blob([item.file], { type: 'image/png' });
      const filename = `${item.file.name}-${item.gridId}x${item.projectId}.png`;
      zip.file(filename, new File([blob], filename));
    }

    const base64 = await zip.generateAsync({ type: 'base64' });
    const blobSrc = new Blob([StringHelper.base64ToUint8(base64)], {
      type: 'data:application/zip;base64',
    });
    const url = URL.createObjectURL(blobSrc);
    const link = document.createElement('a');
    const filename = `${project.name} (project pack).zip`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
  }
}
