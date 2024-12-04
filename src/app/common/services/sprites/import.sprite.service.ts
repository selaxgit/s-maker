import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { lastValueFrom } from 'rxjs';

import { CanvasHelper, ZipHelper } from '../../helpers';
import {
  IFramesDefinition,
  ISpriteAnimation,
  ISpriteAnimationLayer,
  ISpriteAnimationLayerFrame,
  ISpriteAnimationsDefinition,
  ISpriteDefinition,
} from '../../interfaces';
import { FramesService, FramesTreeDBService } from '../frames';
import { SpritesAnimationService } from './sprite-animation.service';
import { SpriteFramesService } from './sprite-frames.service';
import { SpriteLayersService } from './sprite-layers.service';
import { SpritesService } from './sprites.service';
import { SpritesTreeDBService } from './sprites-tree.db.service';

@Injectable({
  providedIn: 'root',
})
export class ImportSpriteService {
  constructor(
    protected readonly spritesService: SpritesService,
    protected readonly spriteLayersService: SpriteLayersService,
    protected readonly spritesAnimationService: SpritesAnimationService,
    protected readonly spritesTreeDBService: SpritesTreeDBService,
    protected readonly framesTreeDBService: FramesTreeDBService,
    protected readonly spriteFramesService: SpriteFramesService,
    protected readonly framesService: FramesService,
  ) {}

  public async importSpriteZip(projectId: number, treeId: number | null, data: ArrayBuffer): Promise<void> {
    const zip = new JSZip();
    const zipData = await zip.loadAsync(data);
    const framesJson = await ZipHelper.getJSONFromZip<IFramesDefinition[]>(zipData, 'frames-def.json');
    const spriteJson = await ZipHelper.getJSONFromZip<ISpriteDefinition>(zipData, 'sprite-def.json');
    const canvasTexture = await ZipHelper.getCanvasFromZip(zipData, 'texture.png');
    if (!spriteJson) {
      throw new Error('Нет данных о спрайте');
    }
    const filesMap: Map<number, number> = new Map();
    const layersMap: Map<number, number> = new Map();
    const framesMap: Map<number, number> = new Map();
    if (canvasTexture && framesJson) {
      const fileTree = await lastValueFrom(
        this.framesTreeDBService.insert({
          projectId,
          parentId: null,
          name: spriteJson.name,
        }),
      );
      for (const frameInfo of framesJson) {
        let idx = 1;
        for (const frame of frameInfo.frames) {
          const fileName = `${spriteJson.name}-file-${idx}`;
          const file = await CanvasHelper.cropCanvasToFile(fileName, canvasTexture, frame.rect);
          if (!file) {
            continue;
          }
          const newFrame = await lastValueFrom(this.framesService.add(projectId, fileTree.id, file));
          idx++;
          filesMap.set(frame.frameId, newFrame.id);
        }
        const sprite = await lastValueFrom(
          this.spritesService.insert({
            projectId,
            treeId,
            name: spriteJson.name,
            width: spriteJson.width,
            height: spriteJson.height,
            bgColor: null,
            groundPointX: spriteJson.groundPointX,
            groundPointY: spriteJson.groundPointY,
            visibleGroundPoint: false,
          }),
        );

        for (const layer of spriteJson.layers) {
          const newLayer = await lastValueFrom(
            this.spriteLayersService.insert({
              projectId,
              spriteId: sprite.id,
              name: layer.name,
              visible: true,
              x: layer.x,
              y: layer.y,
              zIndex: layer.zIndex,
              bgColor: null,
              flipHorizontal: layer.flipHorizontal ?? false,
              flipVertical: layer.flipVertical ?? false,
            }),
          );
          layersMap.set(layer.id, newLayer.id);
          idx = 1;
          for (const frame of layer.frames) {
            if (!filesMap.has(frame.fileId)) {
              continue;
            }
            idx++;
            const frameId = filesMap.get(frame.fileId) as number;
            const frameName = `Frame-${idx}`;
            const newFrame = await lastValueFrom(
              this.spriteFramesService.insert({
                projectId,
                spriteId: sprite.id,
                layerId: newLayer.id,
                frameId,
                name: frameName,
                x: frame.x,
                y: frame.y,
                width: frame.width,
                height: frame.height,
                visible: true,
              }),
            );
            framesMap.set(frame.fileId, newFrame.id);
          }
        }
        const animations: Partial<ISpriteAnimation>[] = (spriteJson.animations || []).map(
          (i: ISpriteAnimationsDefinition) => ({
            projectId,
            spriteId: sprite.id,
            name: i.name,
            default: i.default,
            groundPoint: i.groundPoint,
            collisionFrame: i.collisionFrame,
            layers: i.layers
              .filter((l: ISpriteAnimationLayer) => layersMap.has(Number(l.layerId)))
              .map((l: ISpriteAnimationLayer) => ({
                layerId: layersMap.get(Number(l.layerId)),
                loop: l.loop,
                speed: l.speed,
                frames: l.frames
                  .filter((f: ISpriteAnimationLayerFrame) => framesMap.has(f.id))
                  .map((f: ISpriteAnimationLayerFrame) => ({ ...f, id: framesMap.get(f.id) as number })),
              })) as ISpriteAnimationLayer[],
          }),
        );
        for (const animation of animations) {
          await lastValueFrom(this.spritesAnimationService.insert(animation));
        }
      }
    }
  }
}
