import { DestroyOptions, Graphics, Sprite, Texture } from 'pixi.js';

import { SceneLayerTypeEnum } from '~core/constants';
import { ISceneLayer, ITilesGrid, ITilesGridItem } from '~core/interfaces';

import { SBDrawSceneService } from '../../../services';
import { BaseLayerContainer } from '../base-layer.container';

export class LayerGridContainer extends BaseLayerContainer {
  private gridSprite: Sprite | null = null;

  private gridLines = new Graphics();

  private hasGridLines = false;

  constructor(
    override readonly typeLayer: SceneLayerTypeEnum,
    override readonly guidLayer: string,
    protected override readonly drawSceneService: SBDrawSceneService | null = null,
  ) {
    super(typeLayer, guidLayer, drawSceneService);
    this.gridLines.zIndex = 10;
    this.addChild(this.gridLines);
  }

  override destroy(options?: DestroyOptions): void {
    if (this.gridSprite) {
      this.gridSprite.destroy();
    }
    super.destroy(options);
  }

  override async drawLayer(layerInfo: ISceneLayer): Promise<void> {
    if (this.hasGridLines) {
      this.gridLines.visible = layerInfo.visibleGridLines ?? false;
    }
    if (this.gridSprite || !layerInfo.referenceGridId) {
      return;
    }
    const gridInfo = await this.drawSceneService?.fetchGridById(layerInfo.referenceGridId);
    if (!gridInfo) {
      console.error(`Сетка не найдена по id: ${layerInfo.referenceGridId}`);
      return;
    }
    if (!this.hasGridLines) {
      await this.initGridLines(gridInfo);
      this.gridLines.visible = layerInfo.visibleGridLines ?? false;
    }
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = gridInfo.mapInfo.width * gridInfo.tileInfo.width;
    gridCanvas.height = gridInfo.mapInfo.height * gridInfo.tileInfo.height;
    const ctxGrid = gridCanvas.getContext('2d');
    if (!ctxGrid) {
      console.error('Ошибка при получении getContext');
      return;
    }
    const offscreenCanvas = document.createElement('canvas');
    const ctxOffscreen = offscreenCanvas.getContext('2d');
    if (!ctxOffscreen) {
      console.error('Ошибка при получении getContext для offscreen canvas');
      return;
    }

    const items = [...gridInfo.items];
    items.sort((a: ITilesGridItem, b: ITilesGridItem) => a.zIndex - b.zIndex);
    for (const item of items) {
      const canvasCache = await this.drawSceneService?.getFrameCanvasCache(item.frameId);
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

  private async initGridLines(gridInfo: ITilesGrid): Promise<void> {
    this.gridLines.clear();
    const width = gridInfo.mapInfo.width * gridInfo.tileInfo.width;
    const height = gridInfo.mapInfo.height * gridInfo.tileInfo.height;
    for (let x = 0; x <= width; x += gridInfo.tileInfo.width) {
      this.gridLines.moveTo(x, 0).lineTo(x, height).stroke({ width: 1, color: 0xc6c6c6 });
    }
    for (let y = 0; y <= height; y += gridInfo.tileInfo.height) {
      this.gridLines.moveTo(0, y).lineTo(width, y).stroke({ width: 1, color: 0xc6c6c6 });
    }
    this.hasGridLines = true;
  }
}
