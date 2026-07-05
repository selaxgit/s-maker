import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ISUCoords } from '@selax/utils';

import { SceneLayerTypeEnum } from '~core/constants';
import { EditSceneStore } from '~core/stores';
import { AppPixiStateEnum, ZoomEnum } from '~pixijs/interfaces';

import { SBDrawSceneService } from '../../services';
import { ISceneObjectChange, ISceneObjectSelected } from './interfaces';
import { ISceneSpritePlayChanged, ScenePixiApp } from './scenePixiApp';

@Component({
  selector: 'sb-draw-pixi',
  template: '<div #appPixi class="pixi-container"></div>',
  styles: ':host {position: relative;display: flex; flex-direction: column;}',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SBDrawPixi implements AfterViewInit, OnDestroy, OnInit {
  readonly editSceneStore = inject(EditSceneStore);

  private readonly appPixiRef = viewChild.required<ElementRef<HTMLDivElement>>('appPixi');

  private readonly drawSceneService = inject(SBDrawSceneService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly scenePixiApp = new ScenePixiApp(this.drawSceneService);

  private lastToolState: AppPixiStateEnum | null = null;

  constructor() {
    effect(() => {
      this.scenePixiApp.state = this.editSceneStore.toolbarState();
    });
    effect(() => {
      const layers = this.editSceneStore.layers();
      this.scenePixiApp.drawLayers(layers);
    });
    effect(() => {
      const currentLayer = this.editSceneStore.currentLayer();
      const currentObject = this.editSceneStore.currentObject();
      this.scenePixiApp.selectedObject(currentLayer?.guid ?? null, currentObject?.guid ?? null);
    });
    this.editSceneStore.zoomState$
      .pipe(takeUntilDestroyed())
      .subscribe((zoom: ZoomEnum) => this.scenePixiApp.setZoom(zoom));
  }

  ngOnInit(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  ngAfterViewInit(): void {
    this.initializePixi();
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    if (this.scenePixiApp) {
      this.scenePixiApp.destroy(true, true);
    }
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.scenePixiApp.state !== AppPixiStateEnum.Move) {
      switch (e.code) {
        case 'Space':
          this.lastToolState = this.editSceneStore.toolbarState();
          this.editSceneStore.setToolbarState(AppPixiStateEnum.Move);
          break;
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === 'Space' && this.lastToolState) {
      this.editSceneStore.setToolbarState(this.lastToolState);
      this.lastToolState = null;
    }
  };

  private async initializePixi(): Promise<void> {
    if (this.appPixiRef()?.nativeElement) {
      this.scenePixiApp.state = this.editSceneStore.toolbarState();
      await this.scenePixiApp.initialize(this.appPixiRef()!.nativeElement);
      this.scenePixiApp.onMouseMove = (coords: ISUCoords | null) => {
        if (!coords) {
          this.editSceneStore.setStatusbarCoords(null);
        } else {
          const x = coords.x < 0 ? `<span class="text-danger text-bold">${coords.x}</span>` : coords.x;
          const y = coords.y < 0 ? `<span class="text-danger text-bold">${coords.y}</span>` : coords.y;
          this.editSceneStore.setStatusbarCoords(`Текущие координаты: ${x}x${y}`);
        }
      };
      this.scenePixiApp.sceneSpritePlayChanged$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(({ guidLayer, guidObject, playing }: ISceneSpritePlayChanged) => {
          this.editSceneStore.updateLayerObject(guidLayer, guidObject, { playing });
        });
      this.scenePixiApp.sceneObjectChange$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((params: ISceneObjectChange) => {
          switch (params.typeLayer) {
            case SceneLayerTypeEnum.Events:
            case SceneLayerTypeEnum.Grounds:
              this.editSceneStore.updateLayerObject(params.guidLayer, params.guidObject, {
                x: params.rect.x,
                y: params.rect.y,
                width: params.rect.width,
                height: params.rect.height,
              });
              break;
            case SceneLayerTypeEnum.Sprites:
            case SceneLayerTypeEnum.Frames:
              this.editSceneStore.updateLayerObject(params.guidLayer, params.guidObject, {
                x: params.rect.x,
                y: params.rect.y,
              });
              break;
          }
        });
      this.scenePixiApp.sceneObjectSelected$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((params: ISceneObjectSelected) => {
          this.editSceneStore.setCurrentByGuid(params.guidLayer, params.guidObject);
        });
      this.scenePixiApp.selectedWidthHeightText$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((text: string | null) => {
          this.editSceneStore.setStatusbarWidthHeight(text);
        });
    }
  }
}
