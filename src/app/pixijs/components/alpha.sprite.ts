import { FederatedPointerEvent, Sprite, Texture } from 'pixi.js';

export class AlphaSprite extends Sprite {
  alphaMap: Uint8Array | null = null;

  static createFromCanvas(canvas: HTMLCanvasElement): AlphaSprite | null {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const alphaMap = new Uint8Array(canvas.width * canvas.height);
    for (let i = 0; i < alphaMap.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      alphaMap[i] = imageData.data[i * 4 + 3];
    }
    const sprite = new AlphaSprite(Texture.from(canvas));
    sprite.alphaMap = alphaMap;
    return sprite;
  }

  isHitTest(e: FederatedPointerEvent): boolean {
    const point = e.getLocalPosition(this);
    const x = Math.floor(point.x);
    const y = Math.floor(point.y);
    if (this.alphaMap && x >= 0 && x < this.texture.width && y >= 0 && y < this.texture.height) {
      if (this.alphaMap[y * this.texture.width + x] > 0) {
        return true;
      }
    }
    return false;
  }
}
