/* eslint-disable @typescript-eslint/no-magic-numbers */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SInputNumberComponent } from '@selax/ui';
import { SUNumberHelper } from '@selax/utils';
import { makeNoise2D } from 'open-simplex-noise';
import { Noise2D } from 'open-simplex-noise/lib/2d';

import { SMCHeaderComponent } from '~components/header';
import { SMCScaleButtons } from '~components/scale-buttons';
import { APP_TITLE, LANDSCAPE_GENERATOR_MODULE } from '~constants/base.constants';
import { BaseProjectPageDirective } from '~core/classes/base-project-page.directive';
import { PageNotFound } from '~pages/page-not-found';
import { AppPixiStateEnum, ZoomEnum } from '~pixijs/interfaces';

import { BiomeEnum, LandscapeType } from '../../constants';
import { LandscapeApp } from '../../pixijs/landscape.app';

const DEF_LAND_WIDTH = 50;
const DEF_LAND_HEIGHT = 50;
const DEF_ELEVATION_SID = 1;
const DEF_HUMIDITY_SID = 2;
const DEF_ELEVATION_EXPONENT = 1;
const DEF_HUMIDITY_EXPONENT = 1;

interface IParams {
  width: number;
  height: number;
  elevationSid: number;
  humiditySid: number;
  elevationExp: number;
  humidityExp: number;
}

interface IValue {
  elevation: number;
  humidity: number;
}

type ValuesType = IValue[][];

@Component({
  selector: 'lg-home-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    SInputNumberComponent,
    PageNotFound,
    SMCHeaderComponent,
    SMCScaleButtons,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LGHomePage extends BaseProjectPageDirective implements OnInit, AfterViewInit, OnDestroy {
  readonly generatingState = signal<boolean>(false);

  private readonly appPixiRef = viewChild.required<ElementRef<HTMLDivElement>>('appPixi');

  private readonly landscapeApp = new LandscapeApp();

  readonly formGroup = new FormGroup({
    width: new FormControl<number>(DEF_LAND_WIDTH, { nonNullable: true, validators: Validators.required }),
    height: new FormControl<number>(DEF_LAND_HEIGHT, { nonNullable: true, validators: Validators.required }),
    elevationSid: new FormControl<number>(DEF_ELEVATION_SID, { nonNullable: true, validators: Validators.required }),
    humiditySid: new FormControl<number>(DEF_HUMIDITY_SID, { nonNullable: true, validators: Validators.required }),
    elevationExp: new FormControl<number>(DEF_ELEVATION_EXPONENT, {
      nonNullable: true,
      validators: Validators.required,
    }),
    humidityExp: new FormControl<number>(DEF_HUMIDITY_EXPONENT, { nonNullable: true, validators: Validators.required }),
  });

  constructor() {
    super();
    effect(() => {
      const projectName = this.projectStore.projectName();
      if (projectName) {
        this.titleService.setTitle(`${LANDSCAPE_GENERATOR_MODULE.name} | ${projectName} | ${APP_TITLE}`);
      }
    });
  }

  override ngOnInit(): void {
    this.breadcrumbsStore.resetPage();
    this.breadcrumbsStore.setModule(LANDSCAPE_GENERATOR_MODULE.name);
    super.ngOnInit();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initialize());
  }

  ngOnDestroy(): void {
    if (this.landscapeApp) {
      this.landscapeApp.destroy();
    }
  }

  handleZoom(value: ZoomEnum): void {
    if (this.landscapeApp) {
      this.landscapeApp.setZoom(value);
    }
  }

  handleGenerate(): void {
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    this.formGroup.disable();
    this.generatingState.set(true);
    const map = this.generate();
    this.formGroup.enable();
    if (this.landscapeApp) {
      this.landscapeApp.drawMap(map);
    }
    this.generatingState.set(false);
  }

  handleShuffleSidControl(controlName: string): void {
    const MAX_SID = 999999;
    this.formGroup.get(controlName)?.setValue(SUNumberHelper.getRandomInt(1, MAX_SID));
  }

  private async initialize(): Promise<void> {
    if (this.appPixiRef()?.nativeElement) {
      await this.landscapeApp.initialize(this.appPixiRef()!.nativeElement);
      this.landscapeApp.state = AppPixiStateEnum.Move;
    }
  }

  private generate(): LandscapeType {
    const params = this.formGroup.getRawValue();
    const values = this.generateValues(params);
    const map: LandscapeType = [];
    for (let x = 0; x < params.width; x++) {
      for (let y = 0; y < params.height; y++) {
        if (!Array.isArray(map[x])) {
          map[x] = [];
        }
        map[x][y] = {
          biome: this.getBiome(values[x][y].elevation, values[x][y].humidity),
          mode: 0,
        };
      }
    }
    return map;
  }

  private generateValues(params: IParams): ValuesType {
    const values: ValuesType = [];
    const elevation2D = makeNoise2D(params.elevationSid);
    const humiditySid2D = makeNoise2D(params.humiditySid);
    for (let x = 0; x < params.width; x++) {
      for (let y = 0; y < params.height; y++) {
        if (!Array.isArray(values[x])) {
          values[x] = [];
        }
        const nx = x / params.width - 0.5;
        const ny = y / params.height - 0.5;
        const e =
          1 * this.noise(elevation2D, 1 * nx, 1 * ny) +
          0.5 * this.noise(elevation2D, 2 * nx, 2 * ny) +
          0.25 * this.noise(elevation2D, 4 * nx, 4 * ny);
        const h =
          1 * this.noise(humiditySid2D, 1 * nx, 1 * ny) +
          0.5 * this.noise(humiditySid2D, 2 * nx, 2 * ny) +
          0.25 * this.noise(humiditySid2D, 4 * nx, 4 * ny);
        values[x][y] = {
          elevation: Math.pow(e, params.elevationExp),
          humidity: Math.pow(h, params.humidityExp),
        };
      }
    }
    return values;
  }

  private noise(func: Noise2D, x: number, y: number): number {
    return func(x, y) / 2 + 0.5;
  }

  private getBiome(elevation: number, humidity: number): BiomeEnum {
    if (elevation < 0.1) {
      return BiomeEnum.OCEAN;
    }
    if (elevation < 0.12) {
      return BiomeEnum.BEACH;
    }

    if (elevation > 0.8) {
      if (humidity < 0.1) {
        return BiomeEnum.SCORCHED;
      }
      if (humidity < 0.2) {
        return BiomeEnum.BARE;
      }
      if (humidity < 0.5) {
        return BiomeEnum.TUNDRA;
      }
      return BiomeEnum.SNOW;
    }

    if (elevation > 0.6) {
      if (humidity < 0.33) {
        return BiomeEnum.TEMPERATE_DESERT;
      }
      if (humidity < 0.66) {
        return BiomeEnum.SHRUBLAND;
      }
      return BiomeEnum.TAIGA;
    }

    if (elevation > 0.3) {
      if (humidity < 0.16) {
        return BiomeEnum.TEMPERATE_DESERT;
      }
      if (humidity < 0.5) {
        return BiomeEnum.GRASSLAND;
      }
      if (humidity < 0.83) {
        return BiomeEnum.TEMPERATE_DECIDUOUS_FOREST;
      }
      return BiomeEnum.TEMPERATE_RAIN_FOREST;
    }

    if (humidity < 0.16) {
      return BiomeEnum.SUBTROPICAL_DESERT;
    }
    if (humidity < 0.33) {
      return BiomeEnum.GRASSLAND;
    }
    if (humidity < 0.66) {
      return BiomeEnum.TROPICAL_SEASONAL_FOREST;
    }
    return BiomeEnum.TROPICAL_RAIN_FOREST;
  }
}
