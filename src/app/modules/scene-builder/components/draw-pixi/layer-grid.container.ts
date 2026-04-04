import { Container, DestroyOptions, Sprite, Texture } from 'pixi.js';

import { SceneLayerTypeEnum } from '~core/constants';
import { ITilesGridItem } from '~core/interfaces';

import { SBDrawSceneService } from '../../services';
import { ILayerGrid, IPixiSceneLayer } from './interfaces';

export class LayerGridContainer extends Container implements IPixiSceneLayer {
  typeLayer: SceneLayerTypeEnum | null = null;

  guidLayer: string | null = null;

  private gridSprite: Sprite | null = null;

  constructor(private readonly drawSceneService: SBDrawSceneService) {
    super();
  }

  override destroy(options?: DestroyOptions): void {
    if (this.gridSprite) {
      this.gridSprite.destroy();
    }
    super.destroy(options);
  }

  async drawObjects(objectsInfo: ILayerGrid): Promise<void> {
    if (this.gridSprite) {
      return;
    }
    const gridInfo = await this.drawSceneService.fetchGridById(objectsInfo.referenceGridId);
    if (!gridInfo) {
      console.error(`Сетка не найдена по id: ${objectsInfo.referenceGridId}`);
      return;
    }
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = gridInfo.mapInfo.width * gridInfo.tileInfo.width;
    gridCanvas.height = gridInfo.mapInfo.height * gridInfo.tileInfo.height;
    const ctxGrid = gridCanvas.getContext('2d');
    if (!ctxGrid) {
      console.error('Ошибка при получении getContext');
      return;
    }
    // Single reusable offscreen canvas
    const offscreenCanvas = document.createElement('canvas');
    const ctxOffscreen = offscreenCanvas.getContext('2d');
    if (!ctxOffscreen) {
      console.error('Ошибка при получении getContext для offscreen canvas');
      return;
    }

    const items = [...gridInfo.items];
    items.sort((a: ITilesGridItem, b: ITilesGridItem) => a.zIndex - b.zIndex);
    for (const item of items) {
      const canvasCache = await this.drawSceneService.getFrameCanvasCache(item.frameId);
      let canvasCopy: HTMLCanvasElement | undefined;
      if (item.flipHorizontal && item.flipVertical) {
        canvasCopy = canvasCache?.canvasFlipHV;
      } else if (item.flipHorizontal && !item.flipVertical) {
        canvasCopy = canvasCache?.canvasFlipH;
      } else if (!item.flipHorizontal && item.flipVertical) {
        canvasCopy = canvasCache?.canvasFlipV;
      } else {
        canvasCopy = canvasCache?.canvas;
      }
      if (!canvasCopy) {
        continue;
      }
      let width = canvasCopy.width;
      let height = canvasCopy.height;
      if (item.stretch) {
        width = gridInfo.tileInfo.width;
        height = gridInfo.tileInfo.height;
      }

      // Only prepare offscreen rendering if necessary
      if (offscreenCanvas.width !== width || offscreenCanvas.height !== height) {
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
      } else {
        ctxOffscreen.clearRect(0, 0, width, height);
      }

      ctxOffscreen.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, width, height);

      ctxGrid.drawImage(
        offscreenCanvas,
        0,
        0,
        width,
        height,
        item.x * gridInfo.tileInfo.width,
        item.y * gridInfo.tileInfo.height,
        width,
        height,
      );
    }
    this.gridSprite = new Sprite(Texture.from(gridCanvas));
    this.addChild(this.gridSprite);
  }
}
