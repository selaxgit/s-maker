import { IModule } from '~interfaces/base.interface';

export const APP_TITLE = 'S-Maker';
export const FRAMES_COLLECTION_MODULE: IModule = {
  code: 'fc',
  name: 'Коллекция фреймов',
  description: 'Помогает загрузить и рассортировать фреймы для спрайтов и тайлов.',
  moduleRouter: 'frames-collection',
};
export const SPRITES_COLLECTION_MODULE: IModule = {
  code: 'sc',
  name: 'Коллекция спрайтов',
  description: 'Помогает собрать и настроить простые и анимированые спрайты.',
  moduleRouter: 'sprites-collection',
};
export const LANDSCAPE_GENERATOR_MODULE: IModule = {
  code: 'lg',
  name: 'Генератор ландшафта',
  description: 'Помогает сгенерировать ландшафт.',
  moduleRouter: 'landscape-generator',
};
export const TILES_GRID_EDITOR_MODULE: IModule = {
  code: 'tge',
  name: 'Редактор сетки тайлов',
  description: 'Помогает создать тайловый слой для сцены.',
  moduleRouter: 'tiles-grid-editor',
};
export const SCENE_BUILDER_MODULE: IModule = {
  code: 'sb',
  name: 'Сборщик для сцены',
  description: 'Помогает установить объекты на сцене.',
  moduleRouter: 'scene-builder',
};
export const MODULES_LIST: IModule[] = [
  FRAMES_COLLECTION_MODULE,
  SPRITES_COLLECTION_MODULE,
  LANDSCAPE_GENERATOR_MODULE,
  TILES_GRID_EDITOR_MODULE,
  SCENE_BUILDER_MODULE,
];
