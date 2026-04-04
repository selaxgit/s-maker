import { inject, Injectable } from '@angular/core';
import { SSlidePanelService } from '@selax/ui';
import { Observable, of } from 'rxjs';

import { PropertiesType } from '~constants/common.constants';
import { SceneLayerTypeEnum } from '~core/constants';

import { IObjectPropertiesPanelResult, SBObjectPropertiesPanel } from '../components/object-properties-panel';
import { LayerTypeToStrPipe } from '../pipes';

export enum TypeObjectPropertiesPanelEnum {
  ADD_OBJECT,
  EDIT_OBJECT,
  ADD_LAYER,
  EDIT_LAYER,
}

@Injectable({
  providedIn: 'root',
})
export class SBObjectPropertiesPanelService {
  private readonly slidePanelService = inject(SSlidePanelService);

  showObjectPropertiesPanel(
    typeShow: TypeObjectPropertiesPanelEnum,
    typeLayer: SceneLayerTypeEnum,
    objectName: string = '',
    properties: PropertiesType | null = {},
  ): Observable<IObjectPropertiesPanelResult | null> {
    let panelTitle: string;
    switch (typeShow) {
      case TypeObjectPropertiesPanelEnum.ADD_LAYER:
        panelTitle = `Добавление слоя «${new LayerTypeToStrPipe().transform(typeLayer)}»`;
        break;
      case TypeObjectPropertiesPanelEnum.EDIT_LAYER:
        panelTitle = `Редактирование слоя «${new LayerTypeToStrPipe().transform(typeLayer)}»`;
        break;
      case TypeObjectPropertiesPanelEnum.ADD_OBJECT:
        panelTitle = `Добавление объекта «${this.getTypeObject(typeLayer)}»`;
        break;
      case TypeObjectPropertiesPanelEnum.EDIT_OBJECT:
        panelTitle = `Редактирование объекта «${this.getTypeObject(typeLayer)}»`;
        break;
      default:
        return of(null);
    }
    return this.slidePanelService.showPanel$<IObjectPropertiesPanelResult | null>(
      SBObjectPropertiesPanel,
      {
        panelTitle,
        objectName,
        properties,
      },
      { disabledClose: true },
    );
  }

  private getTypeObject(typeLayer: SceneLayerTypeEnum): string {
    switch (typeLayer) {
      case SceneLayerTypeEnum.Events:
        return 'событие';
      case SceneLayerTypeEnum.Grounds:
        return 'земля';
      case SceneLayerTypeEnum.Sprites:
        return 'спрайт';
      default:
        return 'unknown';
    }
  }
}
