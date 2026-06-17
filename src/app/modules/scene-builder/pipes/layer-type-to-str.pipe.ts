import { Pipe, PipeTransform } from '@angular/core';

import { SceneLayerTypeEnum } from '~core/constants';

@Pipe({
  name: 'layerTypeToStr',
  pure: true,
})
export class LayerTypeToStrPipe implements PipeTransform {
  transform(type: SceneLayerTypeEnum): string {
    switch (type) {
      case SceneLayerTypeEnum.Events:
        return 'слой событий';
      case SceneLayerTypeEnum.Grids:
        return 'слой сетки';
      case SceneLayerTypeEnum.Grounds:
        return 'слой земли';
      case SceneLayerTypeEnum.Sprites:
        return 'слой спрайтов';
      default:
        return 'unknown';
    }
  }
}
