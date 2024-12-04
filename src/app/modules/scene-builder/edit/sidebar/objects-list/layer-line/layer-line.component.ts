import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { JSTDialogService } from '@jst/ui';

import { SMCInputTextModalComponent, SMCSelectSpriteModalComponent } from '../../../../../../common/components';
import { HtmlHelper } from '../../../../../../common/helpers';
import { IRect, ISceneObject, IViewTile, SceneObjectType } from '../../../../../../common/interfaces';
import { IAddSceneObjectPayload } from '../../../../../../common/services/scenes';
import { ScenesStore } from '../../../../../../stores/scenes.store';
import {
  IEditObjectPropertiesResult,
  SBEditObjectPropertiesComponent,
} from '../../object-properties/object-properties.component';
import { SBEditSidebarObjectLineComponent } from '../object-line/object-line.component';

@Component({
    selector: 'sb-edit-sidebar-layer-line',
    imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, SBEditSidebarObjectLineComponent],
    templateUrl: './layer-line.component.html',
    styleUrl: './layer-line.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SBEditSidebarLasyerLineComponent implements OnInit, OnChanges {
  @Input() layerName: string = '';

  @Input() layerType!: SceneObjectType;

  @Input() children: ISceneObject[] = [];

  @Input() layerVisible: boolean = false;

  @Input() layer!: ISceneObject;

  tooltipAddButton = '';

  readonly expanded: WritableSignal<boolean> = signal(false);

  private readonly destroyRef$ = inject(DestroyRef);

  private drawContainerRect: IRect | null = null;

  constructor(
    public readonly scenesStore: ScenesStore,
    private readonly jstDialogService: JSTDialogService,
  ) {}

  ngOnInit(): void {
    this.scenesStore.expandObjectEvent$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((id: number) => {
      if (this.layer.id === id) {
        this.expanded.set(true);
      }
    });
    this.scenesStore.drawContainerRect$.pipe(takeUntilDestroyed(this.destroyRef$)).subscribe((rect: IRect) => {
      this.drawContainerRect = rect;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.prototype.hasOwnProperty.call(changes, 'layerType')) {
      this.updateTooltipAddButton();
    }
    if (Object.prototype.hasOwnProperty.call(changes, 'children')) {
      if (this.children.length === 0) {
        this.expanded.set(false);
      }
    }
  }

  onLayerAddChild(e: MouseEvent): void {
    e.stopPropagation();
    HtmlHelper.blurActiveElement();
    switch (this.layerType) {
      case 'layer-events':
        this.addObjectChild('event');
        break;
      case 'layer-ground':
        this.addObjectChild('ground');
        break;
      case 'layer-sprites':
        this.addSpriteChild();
        break;
    }
  }

  onToggleLayerVisible(e: MouseEvent): void {
    e.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.scenesStore.updateSceneObject(this.layer.sceneId, this.layer.id, { visible: !this.layer.visible });
  }

  onRemoveLayer(e: MouseEvent): void {
    e.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.jstDialogService
      .showConfirm('Вы действительно хотите удалить этот слой и его объекты?', 'Удаление слоя', 'Удалить слой')
      .subscribe((confirm: boolean) => {
        if (confirm) {
          this.scenesStore.removeSceneObject(this.layer.sceneId, this.layer.id);
        }
      });
  }

  onEditLayerName(e: MouseEvent): void {
    e.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.jstDialogService
      .showModal<string | undefined>(
        `Редактирование наименование слоя #${this.layer.id}`,
        SMCInputTextModalComponent,
        {
          label: 'Наименование слоя',
          applyTitle: 'Применить',
          value: this.layer.name,
        },
        true,
      )
      .subscribe((value: string | undefined) => {
        if (value !== undefined) {
          this.scenesStore.updateSceneObject(this.layer.sceneId, this.layer.id, { name: value });
        }
      });
  }

  onToggleExpand(event?: MouseEvent): void {
    event?.stopPropagation();
    HtmlHelper.blurActiveElement();
    this.expanded.update((expand: boolean) => !expand);
  }

  private updateTooltipAddButton(): void {
    switch (this.layerType) {
      case 'layer-events':
        this.tooltipAddButton = 'Добавить событие';
        break;
      case 'layer-ground':
        this.tooltipAddButton = 'Добавить землю';
        break;
      case 'layer-sprites':
        this.tooltipAddButton = 'Добавить спрайт';
        break;
    }
  }

  private addSpriteChild(): void {
    this.jstDialogService
      .showModal<
        IViewTile[],
        { projectId: number; multiple: boolean }
      >('Выбор спрайта', SMCSelectSpriteModalComponent, { projectId: this.layer.projectId, multiple: true }, true, false)
      .subscribe((sprites: IViewTile[]) => {
        if (!sprites) {
          return;
        }

        let x = 0;
        let y = 0;
        if (this.drawContainerRect) {
          x = this.drawContainerRect.width / 2 - this.drawContainerRect.x;
          y = this.drawContainerRect.height / 2 - this.drawContainerRect.y;
        }
        const payload = sprites.map((sprite: IViewTile) => ({
          projectId: this.layer.projectId,
          sceneId: this.layer.sceneId,
          parentId: this.layer.id,
          type: 'sprite',
          name: sprite.name,
          referenceId: sprite.id,
          x,
          y,
          width: sprite.width,
          height: sprite.height,
        })) as Partial<IAddSceneObjectPayload>[];
        this.scenesStore.addMultiSceneObjects(this.layer.sceneId, payload);
        this.expanded.set(true);
      });
  }

  private addObjectChild(type: SceneObjectType): void {
    let title = 'Добавление объекта';
    switch (type) {
      case 'event':
        title += ' <событие>';
        break;
      case 'ground':
        title += ' <земля>';
        break;
    }
    this.jstDialogService
      .showModal<
        IEditObjectPropertiesResult | undefined,
        IEditObjectPropertiesResult | {}
      >(title, SBEditObjectPropertiesComponent, {}, true)
      .subscribe((data: IEditObjectPropertiesResult | undefined) => {
        if (data) {
          let x = 0;
          let y = 0;
          if (this.drawContainerRect) {
            x = this.drawContainerRect.width / 2 - this.drawContainerRect.x;
            y = this.drawContainerRect.height / 2 - this.drawContainerRect.y;
          }
          this.scenesStore.addSceneObject(this.layer.sceneId, {
            projectId: this.layer.projectId,
            sceneId: this.layer.sceneId,
            parentId: this.layer.id,
            type,
            name: data.name,
            properties: data.properties,
            referenceId: null,
            x,
            y,
            width: 25,
            height: 25,
          });
          this.expanded.set(true);
        }
      });
  }
}
