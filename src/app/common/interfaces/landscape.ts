export enum BiomeEnum {
  OCEAN, // океан
  BEACH, // пляж
  SCORCHED, // сухая земля
  BARE, // голый
  TUNDRA, // тундра
  SNOW, // снег
  SHRUBLAND, // кустарник
  TAIGA, // тайга
  TEMPERATE_DESERT, // умеренная пустыня
  GRASSLAND, // трава
  TEMPERATE_DECIDUOUS_FOREST, // умеренный листьевый лес
  TEMPERATE_RAIN_FOREST, // умеренный дождливый лес
  SUBTROPICAL_DESERT, // субтропическая пустыня
  TROPICAL_SEASONAL_FOREST, // тропический сезонный лес
  TROPICAL_RAIN_FOREST, // тропический дождливый лес
}

export const BiomeColors = {
  [BiomeEnum.OCEAN]: 0x44447a, // океан
  [BiomeEnum.BEACH]: 0xa09077, // пляж
  [BiomeEnum.SCORCHED]: 0x999999, // сухая земля
  [BiomeEnum.BARE]: 0xbbbbbb, // голый
  [BiomeEnum.TUNDRA]: 0xddddbb, // тундра
  [BiomeEnum.SNOW]: 0xf8f8f8, // снег
  [BiomeEnum.SHRUBLAND]: 0xc4ccbb, // кустарник
  [BiomeEnum.TAIGA]: 0xccd4bb, // тайга
  [BiomeEnum.TEMPERATE_DESERT]: 0xe4e8ca, // умеренная пустыня
  [BiomeEnum.GRASSLAND]: 0xc4d4aa, // трава
  [BiomeEnum.TEMPERATE_DECIDUOUS_FOREST]: 0xb4c9a9, // умеренный листьевый лес
  [BiomeEnum.TEMPERATE_RAIN_FOREST]: 0xa4c4a8, // умеренный дождливый лес
  [BiomeEnum.SUBTROPICAL_DESERT]: 0xe9ddc7, // субтропическая пустыня
  [BiomeEnum.TROPICAL_SEASONAL_FOREST]: 0xa9cca4, // тропический сезонный лес
  [BiomeEnum.TROPICAL_RAIN_FOREST]: 0x9cbba9, // тропический дождливый лес
};

export interface ILandscape {
  biome: BiomeEnum;
  mode: number;
}

export type LandscapeType = ILandscape[][];
