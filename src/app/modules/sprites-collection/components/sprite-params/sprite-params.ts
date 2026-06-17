import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SCheckboxComponent, SColorPickerComponent, SInputNumberComponent } from '@selax/ui';
import { SUSessionStorageService } from '@selax/utils';

import { IEditSpriteGroundPoint, IEditSpriteParams, ISpriteLayer } from '~core/interfaces';
import { EditSpriteStore } from '~core/stores';

const STORE_EXPAND_PARAMS_KEY = 'spriteParamsExpand';
const STORE_EXPAND_GROUND_POINT_KEY = 'spriteGroundPointExpand';
const STORE_EXPAND_LAYER_PARAMS_KEY = 'spriteLayerParamsExpand';
const STORE_EXPAND_FRAME_PARAMS_KEY = 'spriteFrameParamsExpand';

@Component({
  selector: 'sc-sprite-params',
  imports: [MatButtonModule, MatIconModule, SInputNumberComponent, SColorPickerComponent, SCheckboxComponent],
  templateUrl: './sprite-params.html',
  styleUrl: './sprite-params.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SCSpriteParams implements OnInit {
  readonly expandParams = signal<boolean>(true);

  readonly expandGroundPoint = signal<boolean>(false);

  readonly expandLayerParams = signal<boolean>(true);

  readonly expandFrameParams = signal<boolean>(true);

  readonly editSpriteStore = inject(EditSpriteStore);

  private readonly sessionStorageService = inject(SUSessionStorageService);

  ngOnInit(): void {
    const storedExpand = this.sessionStorageService.get<boolean>(STORE_EXPAND_PARAMS_KEY);
    this.expandParams.set(storedExpand !== null ? storedExpand : true);
    const storedGroundPointExpand = this.sessionStorageService.get<boolean>(STORE_EXPAND_GROUND_POINT_KEY);
    this.expandGroundPoint.set(storedGroundPointExpand !== null ? storedGroundPointExpand : true);
    const storedLayerParamsExpand = this.sessionStorageService.get<boolean>(STORE_EXPAND_LAYER_PARAMS_KEY);
    this.expandLayerParams.set(storedLayerParamsExpand !== null ? storedLayerParamsExpand : true);
    const storedFrameParamsExpand = this.sessionStorageService.get<boolean>(STORE_EXPAND_FRAME_PARAMS_KEY);
    this.expandFrameParams.set(storedFrameParamsExpand !== null ? storedFrameParamsExpand : true);
  }

  handleChangeFrameParams(field: keyof ISpriteLayer, value: number | boolean | null): void {
    this.editSpriteStore.updateCurrentFrame({ [field]: value });
  }

  handleChangeLayerParams(field: keyof ISpriteLayer, value: number | string | boolean | null): void {
    this.editSpriteStore.updateCurrentLayer({ [field]: value });
  }

  handleChangeGroundPoint(field: keyof IEditSpriteGroundPoint, value: number | boolean | null): void {
    if (typeof value === 'boolean') {
      this.editSpriteStore.updateGroundPoint({ [field]: value });
    } else {
      this.editSpriteStore.updateGroundPoint({ [field]: value || null });
    }
  }

  handleChangeParams(field: keyof IEditSpriteParams, value: number | string | null): void {
    this.editSpriteStore.updateParams({ [field]: value });
  }

  handleToggleExpandParams(): void {
    const newValue = !this.expandParams();
    this.expandParams.set(newValue);
    this.sessionStorageService.set(STORE_EXPAND_PARAMS_KEY, newValue);
  }

  handleToggleExpandGroundPoint(): void {
    const newValue = !this.expandGroundPoint();
    this.expandGroundPoint.set(newValue);
    this.sessionStorageService.set(STORE_EXPAND_GROUND_POINT_KEY, newValue);
  }

  handleToggleExpandLayerParams(): void {
    const newValue = !this.expandLayerParams();
    this.expandLayerParams.set(newValue);
    this.sessionStorageService.set(STORE_EXPAND_LAYER_PARAMS_KEY, newValue);
  }

  handleToggleExpandFrameParams(): void {
    const newValue = !this.expandFrameParams();
    this.expandFrameParams.set(newValue);
    this.sessionStorageService.set(STORE_EXPAND_FRAME_PARAMS_KEY, newValue);
  }
}
