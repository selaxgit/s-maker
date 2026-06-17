import { ISpriteFrame, ISpriteLayer } from '~core/interfaces';

export class SerialHelper {
  static getFrameSerialNumer(frames: ISpriteFrame[]): number {
    if (!frames) {
      return 1;
    }
    const frameNumbers = frames
      .map((frame: ISpriteFrame) => {
        const match = frame.name.match(/Frame (\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((num: number | null): num is number => num !== null);
    const maxNumber = frameNumbers.length > 0 ? Math.max(...frameNumbers) : 0;
    return maxNumber + 1;
  }

  static getLayerSerialNumer(layers: ISpriteLayer[]): number {
    if (!layers) {
      return 1;
    }
    const layerNumbers = layers
      .map((layer: ISpriteLayer) => {
        const match = layer.name.match(/Layer (\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((num: number | null): num is number => num !== null);
    const maxNumber = layerNumbers.length > 0 ? Math.max(...layerNumbers) : 0;
    return maxNumber + 1;
  }
}
