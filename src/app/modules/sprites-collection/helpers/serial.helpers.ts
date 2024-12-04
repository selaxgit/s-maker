import { ISpriteFrame, ISpriteLayersListItem } from '../../../common/interfaces';

export class SerialHelpers {
  public static getLayerSerialNumer(layers: ISpriteLayersListItem[]): number {
    const namesNums = layers
      .map((i: ISpriteLayersListItem) => {
        const m = i.name.match(/Layer (\d+)/i);
        return m && m[1] ? Number(m[1]) : null;
      })
      .filter((i: number | null) => i) as number[];
    namesNums.push(0);
    return Math.max(...namesNums) + 1;
  }

  public static getFrameSerialNumer(frames: ISpriteFrame[]): number {
    const namesNums = frames
      .map((i: ISpriteFrame) => {
        const m = i.name.match(/Frame (\d+)/i);
        return m && m[1] ? Number(m[1]) : null;
      })
      .filter((i: number | null) => i) as number[];
    namesNums.push(0);
    return Math.max(...namesNums) + 1;
  }
}
