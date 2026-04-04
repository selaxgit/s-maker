import { inject, Injectable } from '@angular/core';
import { SUStringHelper } from '@selax/utils';
import JSZip from 'jszip';
import { lastValueFrom } from 'rxjs';

import { DBFrames, DBFramesTree, DBGrid, DBProjects, DBScenes, DBSprites, DBSpritesTree } from '~core/db';
import { IFrame, IScene, ISprite, ITilesGrid } from '~core/interfaces';
import { TreeHelper } from '~helpers/tree.helper';
import { IDBTreeItem } from '~interfaces/tree.interface';

import * as pkg from '../../../../package.json';

@Injectable({
  providedIn: 'root',
})
export class ExportProjectService {
  private readonly version: string = '???';

  private readonly dbProjects = inject(DBProjects);

  private readonly dbFramesTree = inject(DBFramesTree);

  private readonly dbFrames = inject(DBFrames);

  private readonly dbGrid = inject(DBGrid);

  private readonly dbScenes = inject(DBScenes);

  private readonly dbSpritesTree = inject(DBSpritesTree);

  private readonly dbSprites = inject(DBSprites);

  constructor() {
    this.version = pkg.version;
  }

  async exportProject(projectId: number): Promise<void> {
    const project = await lastValueFrom(this.dbProjects.get(projectId));
    if (!project) {
      throw new Error('Проект не найден');
    }
    const framesTree = await lastValueFrom(
      this.dbFramesTree.getListByFilter((i: IDBTreeItem) => i.projectId === projectId),
    );
    const frames = await lastValueFrom(this.dbFrames.getListByFilter((i: IFrame) => i.projectId === projectId));
    const grid = await lastValueFrom(this.dbGrid.getListByFilter((i: ITilesGrid) => i.projectId === projectId));
    const scenes = await lastValueFrom(this.dbScenes.getListByFilter((i: IScene) => i.projectId === projectId));
    const spritesTree = await lastValueFrom(
      this.dbSpritesTree.getListByFilter((i: IDBTreeItem) => i.projectId === projectId),
    );
    const sprites = await lastValueFrom(this.dbSprites.getListByFilter((i: ISprite) => i.projectId === projectId));

    const jsonFramesTree = TreeHelper.flatToTree(framesTree);
    const jsonSpritesTree = TreeHelper.flatToTree(spritesTree);

    const zip = new JSZip();
    zip.file('version.json', JSON.stringify({ smVersion: this.version }));
    zip.file('project.json', JSON.stringify(project));
    zip.file('frames-tree.json', JSON.stringify(jsonFramesTree));

    zip.file('scenes.json', JSON.stringify(scenes));
    zip.file('sprites-tree.json', JSON.stringify(jsonSpritesTree));
    zip.file('sprites.json', JSON.stringify(sprites));

    const jsonGrid = [];
    for (const item of grid) {
      const filename = item.background.file ? `grid-background-${item.id}` : null;
      if (filename && item.background.file) {
        const blob = new Blob([item.background.file], { type: item.background.file.type });
        zip.file(filename, new File([blob], filename, { type: item.background.file.type }));
      }
      jsonGrid.push({
        id: item.id,
        projectId: item.projectId,
        name: item.name,
        tileInfo: item.tileInfo,
        mapInfo: item.mapInfo,
        background: {
          opacity: item.background.opacity,
          file: null,
        },
        items: item.items,
        zipBackgroundFilename: filename,
        backgroundFilename: item.background.file?.name ?? null,
        backgroundFiletype: item.background.file?.type ?? null,
      });
    }
    zip.file('grid.json', JSON.stringify(jsonGrid));

    const jsonFrames = [];
    for (const item of frames) {
      const filename = `frame-${item.id}`;
      const blob = new Blob([item.file], { type: item.file.type });
      zip.file(filename, new File([blob], filename, { type: item.file.type }));
      jsonFrames.push({
        height: item.height,
        id: item.id,
        name: item.name,
        projectId: item.projectId,
        treeId: item.treeId,
        width: item.width,
        zipFilename: filename,
        filename: item.file.name,
        filetype: item.file.type,
      });
    }
    zip.file('frames.json', JSON.stringify(jsonFrames));

    const base64 = await zip.generateAsync({ type: 'base64' });
    const blobSrc = new Blob([SUStringHelper.base64ToUint8(base64).buffer as ArrayBuffer], {
      type: 'data:application/zip;base64',
    });
    const url = URL.createObjectURL(blobSrc);
    const link = document.createElement('a');
    const filename = `${project.name.toLowerCase().replace(/ /g, '-')} (project pack).zip`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
  }
}
