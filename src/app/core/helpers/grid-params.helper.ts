import { ITilesGridParams } from '~core/interfaces';

export function areGridParamsEqual(params1: ITilesGridParams | null, params2: ITilesGridParams | null): boolean {
  if (!params1 || !params2) return params1 === params2;

  return (
    params1.mapWidth === params2.mapWidth &&
    params1.mapHeight === params2.mapHeight &&
    params1.tileWidth === params2.tileWidth &&
    params1.tileHeight === params2.tileHeight &&
    params1.bgOpacity === params2.bgOpacity &&
    params1.bgFile?.name === params2.bgFile?.name
  );
}
