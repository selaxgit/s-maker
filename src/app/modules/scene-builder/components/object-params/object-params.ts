import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ISelectOption, SCheckboxComponent, SInputNumberComponent, SSelectComponent } from '@selax/ui';

import { SPRITES_COLLECTION_MODULE, TILES_GRID_EDITOR_MODULE } from '~constants/base.constants';
import { SceneLayerTypeEnum } from '~core/constants';
import { SpritesFacade } from '~core/facade';
import {
  ISceneLayer,
  ISceneObjectEventsGround,
  ISceneObjectFrame,
  ISceneObjectSprite,
  ISprite,
  ISpriteAnimation,
  SceneObjectType,
} from '~core/interfaces';
import { EditSceneStore, ProjectStore } from '~core/stores';

type ParamsKeyType =
  | 'visible'
  | 'x'
  | 'y'
  | 'width'
  | 'height'
  | 'zIndex'
  | 'animationGuid'
  | 'playing'
  | 'flipHorizontal'
  | 'flipVertical';

@Component({
  selector: 'sb-object-params',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    SCheckboxComponent,
    SInputNumberComponent,
    SSelectComponent,
    SCheckboxComponent,
    RouterLink,
  ],
  templateUrl: './object-params.html',
  styleUrl: './object-params.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.border-top]': 'expanded()',
  },
})
export class SBObjectParams {
  readonly expanded = signal<boolean>(false);

  readonly title = signal<string>('#unknown');

  readonly visibleWidthHeight = signal<boolean>(false);

  readonly visibleZIndex = signal<boolean>(false);

  readonly visibleAnimation = signal<boolean>(false);

  readonly visibleFlip = signal<boolean>(false);

  readonly animationPlaying = signal<boolean>(false);

  readonly animationsList = signal<ISelectOption[]>([]);

  readonly editRoute = signal<(string | number)[] | null>(null);

  readonly modelVisible = signal<boolean>(true);

  readonly modelX = signal<number>(0);

  readonly modelY = signal<number>(0);

  readonly modelZIndex = signal<number>(0);

  readonly modelWidth = signal<number>(0);

  readonly modelHeight = signal<number>(0);

  readonly modelAnimationGuid = signal<string | null>(null);

  readonly modelFlipHorizontal = signal<boolean>(false);

  readonly modelFlipVertical = signal<boolean>(false);

  readonly hasAnimation = computed(() => !!this.modelAnimationGuid());

  private readonly destroyRef = inject(DestroyRef);

  private readonly projectStore = inject(ProjectStore);

  private readonly editSceneStore = inject(EditSceneStore);

  private readonly spritesFacade = inject(SpritesFacade);

  private animationsCache = new Map<number, ISelectOption[]>();

  constructor() {
    effect(() => {
      const currentLayer = this.editSceneStore.currentLayer();
      const currentObject = this.editSceneStore.currentObject();
      const projectId = this.projectStore.projectId() ?? '';
      this.expanded.set(!!currentLayer || !!currentObject);
      if (currentLayer) {
        this.visibleWidthHeight.set(
          !!currentObject && [SceneLayerTypeEnum.Events, SceneLayerTypeEnum.Grounds].includes(currentLayer.type),
        );
        this.visibleZIndex.set(true);
        this.visibleAnimation.set(!!currentObject && currentLayer.type === SceneLayerTypeEnum.Sprites);
        this.visibleFlip.set(!!currentObject && currentLayer.type === SceneLayerTypeEnum.Frames);
        if (!currentObject) {
          this.setModelsByLayer(currentLayer);
        } else {
          this.setModelsByObject(currentObject, currentLayer.type);
        }
        if (currentLayer.type === SceneLayerTypeEnum.Grids) {
          this.editRoute.set([
            '/',
            projectId,
            TILES_GRID_EDITOR_MODULE.moduleRouter,
            Number(currentLayer.referenceGridId),
          ]);
        } else if (currentLayer.type === SceneLayerTypeEnum.Sprites && currentObject) {
          this.editRoute.set([
            '/',
            projectId,
            SPRITES_COLLECTION_MODULE.moduleRouter,
            Number((currentObject as ISceneObjectSprite).referenceId),
          ]);
        } else {
          this.editRoute.set(null);
        }
      } else {
        this.visibleWidthHeight.set(false);
        this.visibleZIndex.set(false);
        this.visibleAnimation.set(false);
      }
    });
  }

  handleClearSelection(): void {
    this.editSceneStore.setCurrent(null, null);
  }

  handleChangeParams(key: ParamsKeyType, value: boolean | number | string | null, defValue?: number): void {
    if (defValue !== undefined && ((typeof value === 'number' && !value) || value === null)) {
      value = defValue;
    }
    if (value !== null) {
      this.updateParams({ [key]: value });
    }
  }

  private updateParams(params: Partial<ISceneLayer> | Partial<SceneObjectType>): void {
    const currentLayer = this.editSceneStore.currentLayer();
    const currentObject = this.editSceneStore.currentObject();
    if (currentLayer) {
      if (currentObject) {
        this.editSceneStore.updateLayerObject(currentLayer.guid, currentObject.guid, params);
      } else {
        this.editSceneStore.updateLayer(currentLayer.guid, params);
      }
    }
  }

  private setModelsByLayer(currentLayer: ISceneLayer): void {
    this.title.set('Выбран слой');
    this.modelVisible.set(currentLayer.visible);
    this.modelX.set(currentLayer.x);
    this.modelY.set(currentLayer.y);
    this.modelZIndex.set(currentLayer.zIndex);
  }

  private async setModelsByObject(currentObject: SceneObjectType, layerType: SceneLayerTypeEnum): Promise<void> {
    this.title.set('Выбран объект');
    this.modelVisible.set(currentObject.visible);
    this.modelX.set(currentObject.x);
    this.modelY.set(currentObject.y);
    if (this.visibleZIndex()) {
      this.modelZIndex.set(currentObject.zIndex);
    }
    if (this.visibleWidthHeight()) {
      this.modelWidth.set((currentObject as ISceneObjectEventsGround).width);
      this.modelHeight.set((currentObject as ISceneObjectEventsGround).height);
    }
    if (this.visibleFlip()) {
      this.modelFlipHorizontal.set((currentObject as ISceneObjectFrame).flipHorizontal);
      this.modelFlipVertical.set((currentObject as ISceneObjectFrame).flipVertical);
    }
    if (layerType === SceneLayerTypeEnum.Sprites) {
      const spriteObject = currentObject as ISceneObjectSprite;
      this.modelAnimationGuid.set(spriteObject.animationGuid);
      this.animationPlaying.set(spriteObject.playing);
      if (spriteObject.referenceId) {
        this.setAnimationList(spriteObject.referenceId);
      }
    }
  }

  private setAnimationList(referenceId: number): void {
    if (this.animationsCache.has(referenceId)) {
      this.animationsList.set(this.animationsCache.get(referenceId)!);
      return;
    }
    this.spritesFacade
      .fetchSpriteById(referenceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((sprite: ISprite) => {
        const animation: ISelectOption[] = sprite.animations.map((item: ISpriteAnimation) => ({
          value: item.guid,
          title: item.name,
        }));
        this.animationsCache.set(sprite.id, animation);
        this.animationsList.set(animation);
      });
  }
}
