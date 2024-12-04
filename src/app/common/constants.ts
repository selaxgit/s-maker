import { ISMModule, SMModeCodesEnum } from './interfaces';

export const APP_TITLE = 'S-Maker';

export const FRAMES_COLLECTION_MODULE: ISMModule = {
  code: SMModeCodesEnum.framesCollection,
  name: 'Коллекция фреймов',
  imgUrl: 'assets/frames-collection.png',
  desc: 'Помогает загрузить и рассортировать фреймы для спрайтов и тайлов',
  useListMenu: false,
};

export const SPRITES_COLLECTION_MODULE: ISMModule = {
  code: SMModeCodesEnum.spriteCollection,
  name: 'Коллекция спрайтов',
  imgUrl: 'assets/sprites-collection.png',
  desc: 'Помогает собрать и настроить простые и анимированые спрайты',
  useListMenu: false,
};

export const GRID_EDITOR_MODULE: ISMModule = {
  code: SMModeCodesEnum.tilesGridEditor,
  name: 'Редактор сетки тайлов',
  imgUrl: 'assets/grid-editor.png',
  desc: 'Помогает создать тайловый слой',
  useListMenu: true,
  listMenuTitle: 'Список сеток',
};

export const SCENE_BUILDER_MODULE: ISMModule = {
  code: SMModeCodesEnum.sceneBuilder,
  name: 'Сборщик для сцены',
  imgUrl: 'assets/scene-builder.png',
  desc: 'Помогает установить объекты на сцене',
  useListMenu: true,
  listMenuTitle: 'Список сцен',
};

export const LANDSCAPE_GENERATOR_MODULE: ISMModule = {
  code: SMModeCodesEnum.landscapeGenerator,
  name: 'Генератор ландшафта',
  imgUrl: 'assets/landscape-generator.png',
  desc: 'Помогает сгенерировать ландшафт',
  useListMenu: false,
};

export const APP_MODULES: ISMModule[] = [
  FRAMES_COLLECTION_MODULE,
  SPRITES_COLLECTION_MODULE,
  GRID_EDITOR_MODULE,
  SCENE_BUILDER_MODULE,
  LANDSCAPE_GENERATOR_MODULE,
];
