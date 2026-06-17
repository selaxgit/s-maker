import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SDialogService, SSlidePanelService } from '@selax/ui';
import { SUStringHelper } from '@selax/utils';

import { SMCChoiceFramesPanel } from '~components/choice-frames-panel';
import { SMCChoiceSpritesPanel } from '~components/choice-sprites-panel';
import { SceneLayerTypeEnum } from '~core/constants';
import { ScenesFacade } from '~core/facade';
import { ISceneLayer, IViewTile, SceneObjectType } from '~core/interfaces';
import { EditSceneStore } from '~core/stores';

import { LayerTypeToStrPipe } from '../../../../pipes';
import { SBObjectPropertiesPanelService, TypeObjectPropertiesPanelEnum } from '../../../../services';
import { IObjectPropertiesPanelResult } from '../../../object-properties-panel';
import { SBObjectItem } from '../object-item';

@Component({
  selector: 'sb-layer-item',
  imports: [MatButtonModule, MatIconModule, DragDropModule, LayerTypeToStrPipe, SBObjectItem],
  templateUrl: './layer-item.html',
  styleUrl: './layer-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.selected]': 'editSceneStore.currentLayer()?.guid === layer().guid',
  },
})
export class SBLayerItem {
  readonly layer = input.required<ISceneLayer>();

  readonly layerObject = input.required<SceneObjectType[]>();

  readonly sceneLayerTypeEnum = SceneLayerTypeEnum;

  readonly visibleAccordionObjects = signal<boolean>(false);

  readonly editSceneStore = inject(EditSceneStore);

  private readonly destroyRef = inject(DestroyRef);

  private readonly dialogService = inject(SDialogService);

  private readonly slidePanelService = inject(SSlidePanelService);

  private readonly scenesFacade = inject(ScenesFacade);

  private readonly objectPropertiesPanelService = inject(SBObjectPropertiesPanelService);

  constructor() {
    effect(() => {
      const currentLayer = this.editSceneStore.currentLayer();
      const currentObject = this.editSceneStore.currentObject();
      if (currentLayer?.guid === this.layer().guid && currentObject) {
        this.visibleAccordionObjects.set(true);
      }
    });
  }

  handleDropObjects(event: CdkDragDrop<SceneObjectType[]>): void {
    if (event.isPointerOverContainer && event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.editSceneStore.updateLayer(this.layer().guid, { objects: event.container.data });
    }
  }

  handleToggleVisibleLayer(): void {
    this.editSceneStore.updateLayer(this.layer().guid, { visible: !this.layer().visible });
  }

  handleToggleVisibleGridLines(): void {
    const visibleGridLines = this.layer().visibleGridLines ?? false;
    this.editSceneStore.updateLayer(this.layer().guid, { visibleGridLines: !visibleGridLines });
  }

  handleRemoveLayer(): void {
    this.dialogService
      .showConfirm(
        `Вы действительно хотите удалить слой "${this.layer().name}" и его объекты?`,
        'Удаление слоя',
        'Удалить слой',
      )
      .subscribe((isOK: boolean) => {
        if (isOK) {
          this.editSceneStore.removeLayer(this.layer().guid);
        }
      });
  }

  handleEditLayer(): void {
    this.objectPropertiesPanelService
      .showObjectPropertiesPanel(
        TypeObjectPropertiesPanelEnum.EDIT_LAYER,
        this.layer().type,
        this.layer().name,
        this.layer().properties,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: IObjectPropertiesPanelResult | null) => {
        if (result) {
          this.editSceneStore.updateLayer(this.layer().guid, result);
        }
      });
  }

  handleAddObject(): void {
    switch (this.layer().type) {
      case SceneLayerTypeEnum.Sprites:
        this.addSpritesObject();
        break;
      case SceneLayerTypeEnum.Frames:
        this.addFramesObject();
        break;
      default:
        this.addObject();
    }
  }

  handleSelectLayer(): void {
    this.editSceneStore.setCurrent(this.layer());
  }

  handleToggleAccordionObjects(): void {
    this.visibleAccordionObjects.set(!this.visibleAccordionObjects());
  }

  private addSpritesObject(): void {
    this.slidePanelService
      .showPanel$<IViewTile[] | null>(
        SMCChoiceSpritesPanel,
        {
          panelTitle: 'Выберите спрайты для слоя',
          multiple: true,
        },
        { disabledClose: false },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: IViewTile[] | null) => {
        if (Array.isArray(result)) {
          this.addSpritesObjectByIds(result.map((i: IViewTile) => i.id));
        }
      });
  }

  private addFramesObject(): void {
    this.slidePanelService
      .showPanel$<IViewTile[] | null>(
        SMCChoiceFramesPanel,
        {
          panelTitle: 'Выберите фреймы для слоя',
          multiple: true,
        },
        { disabledClose: false },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: IViewTile[] | null) => {
        if (Array.isArray(result)) {
          this.addFramesObjectByIds(result.map((i: IViewTile) => i.id));
        }
      });
  }

  private addObject(): void {
    const layer = this.layer();
    this.objectPropertiesPanelService
      .showObjectPropertiesPanel(TypeObjectPropertiesPanelEnum.ADD_OBJECT, layer.type)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: IObjectPropertiesPanelResult | null) => {
        if (result) {
          this.editSceneStore.addObjectToLayer(layer.guid, {
            guid: SUStringHelper.uuidv4(),
            name: result.name,
            x: 0,
            y: 0,
            zIndex: 0,
            visible: true,
            properties: result.properties,
            width: 25,
            height: 25,
          });
        }
      });
  }

  private async addSpritesObjectByIds(ids: number[]): Promise<void> {
    for (const id of ids) {
      this.scenesFacade.addObjectSpriteToLayer(this.layer().guid, id);
    }
  }

  private async addFramesObjectByIds(ids: number[]): Promise<void> {
    for (const id of ids) {
      this.scenesFacade.addObjectFrameToLayer(this.layer().guid, id);
    }
  }
}
