import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  OnDestroy,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SSlidePanelContainerComponent, SSlidePanelExtendClass, SSlidePanelService } from '@selax/ui';
import { SUCanvasHelper } from '@selax/utils';
import { lastValueFrom } from 'rxjs';

import { SMCChoiceFramesPanel } from '~components/choice-frames-panel';
import { SMCPropertiesContainer } from '~components/properties-container';
import { PropertiesType, ReplaceTilePropertiesEnum } from '~constants/common.constants';
import { ITilesGridItem, IViewTile } from '~core/interfaces';
import { FramesRepository } from '~core/repositories';
import { ObjectToBgUrlPipe } from '~pipes/object-to-bg-url.pipe';
import { CacheFramesCanvasService } from '~services/cache-frames-canvas.service';

export interface ITGEPropertiesPanelResult {
  newFrameId: number | null;
  replaceType: ReplaceTilePropertiesEnum;
  properties: PropertiesType;
}

interface IFrameInfo {
  frameId: number;
  name: string;
  dimension: string;
  objectURL: string;
}

@Component({
  imports: [MatButtonModule, MatIconModule, SSlidePanelContainerComponent, ObjectToBgUrlPipe, SMCPropertiesContainer],
  templateUrl: './properties-panel.html',
  styleUrl: './properties-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TGEPropertiesPanel extends SSlidePanelExtendClass implements OnDestroy {
  readonly panelTitle = input<string>('');

  readonly tile = input<ITilesGridItem | null>(null);

  readonly properties = input<PropertiesType>({});

  readonly frameInfo = signal<IFrameInfo | null>(null);

  readonly vertHorValues = signal<string | null>(null);

  readonly replaceType = model<ReplaceTilePropertiesEnum>(ReplaceTilePropertiesEnum.MERGE);

  readonly visibleReplaceType = computed(() => this.tile() === null);

  private readonly destroyRef = inject(DestroyRef);

  private readonly slidePanelService = inject(SSlidePanelService);

  private readonly cacheFramesCanvasService = inject(CacheFramesCanvasService);

  private readonly framesRepository = inject(FramesRepository);

  private frameFile: File | null = null;

  private newProperties: PropertiesType = {};

  constructor() {
    super();
    effect(() => this.updateFrameInfo(this.tile()));
  }

  handlePropertiesChangeEvent(properties: PropertiesType): void {
    this.newProperties = properties;
  }

  handleChangeFrame(): void {
    if (!this.tile()) {
      return;
    }
    this.slidePanelService
      .showPanel$<IViewTile | null>(
        SMCChoiceFramesPanel,
        {
          panelTitle: 'Выберите фрейм для сетки',
          multiple: false,
          selectedTiles: [this.tile()!.frameId],
        },
        { disabledClose: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tile: IViewTile | null) => {
        if (tile && this.tile()) {
          this.updateFrameInfo({ ...this.tile()!, frameId: tile.id });
        }
      });
  }

  handleDownloadFrame(): void {
    if (this.frameFile && this.frameInfo()) {
      const objectURL = URL.createObjectURL(this.frameFile);
      const link = document.createElement('a');
      link.setAttribute('href', objectURL);
      link.setAttribute('download', `${this.frameInfo()?.name ?? this.frameFile.name}.png`);
      link.click();
    }
  }

  ngOnDestroy(): void {
    if (this.frameInfo()?.objectURL) {
      URL.revokeObjectURL(String(this.frameInfo()?.objectURL));
    }
  }

  handleApply(): void {
    const newFrameId =
      this.tile() && this.frameInfo()?.frameId !== this.tile()?.frameId ? this.frameInfo()?.frameId : null;
    const replaceType = this.replaceType();
    const properties = this.newProperties;
    this.closePanel({ newFrameId, replaceType, properties });
  }

  handleClose(): void {
    this.closePanel(null);
  }

  private async updateFrameInfo(tile: ITilesGridItem | null): Promise<void> {
    if (!tile) {
      this.frameInfo.set(null);
      return;
    }
    this.vertHorValues.set(`${tile.flipVertical ? 'да' : 'нет'}/${tile.flipHorizontal ? 'да' : 'нет'}`);
    const cache = await this.cacheFramesCanvasService.getFrameCanvasCache(tile.frameId);
    const frame = await lastValueFrom(this.framesRepository.fetchFrameById(tile.frameId));

    if (!frame || !cache) {
      this.frameInfo.set(null);
      return;
    }
    this.frameFile = frame.file;
    let canvas: HTMLCanvasElement;
    if (tile.flipHorizontal && tile.flipVertical) {
      canvas = cache.canvasFlipHV;
    } else if (tile.flipHorizontal && !tile.flipVertical) {
      canvas = cache.canvasFlipH;
    } else if (!tile.flipHorizontal && tile.flipVertical) {
      canvas = cache.canvasFlipV;
    } else {
      canvas = cache.canvas;
    }
    let objectURL = '';
    if (canvas) {
      const blob = await SUCanvasHelper.canvasToBlob(canvas);
      objectURL = URL.createObjectURL(blob);
    }
    this.frameInfo.set({
      frameId: tile.frameId,
      name: frame.name,
      dimension: `${frame.width}x${frame.height}`,
      objectURL,
    });
  }
}
