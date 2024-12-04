export enum SMModeCodesEnum {
  framesCollection = 'frames-collection',
  spriteCollection = 'sprites-collection',
  tilesGridEditor = 'tiles-grid-editor',
  sceneBuilder = 'scene-builder',
  landscapeGenerator = 'landscape-generator',
}

export interface ISMModule {
  code: SMModeCodesEnum;
  name: string;
  imgUrl: string;
  desc: string;
  useListMenu: boolean;
  listMenuTitle?: string;
}
