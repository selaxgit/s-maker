import { ISURect } from '@selax/utils';

import { SceneLayerTypeEnum } from '~core/constants';

export interface ISceneObjectChange {
  typeLayer: SceneLayerTypeEnum;
  guidLayer: string;
  guidObject: string;
  rect: ISURect;
}

export interface ISceneObjectSelected {
  guidLayer: string;
  guidObject: string;
}
