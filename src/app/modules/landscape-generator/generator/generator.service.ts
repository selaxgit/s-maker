/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Injectable } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { JSTFormControl } from '@jst/ui';
import { makeNoise2D } from 'open-simplex-noise';
import { Noise2D } from 'open-simplex-noise/lib/2d';
import { BehaviorSubject, Subject } from 'rxjs';

import { BiomeEnum, LandscapeType } from '../../../common/interfaces';

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

@Injectable()
export class GeneratorService {
  public readonly isGenerating$ = new Subject<boolean>();

  public readonly map$ = new BehaviorSubject<LandscapeType>([]);

  public readonly paramsFormGroup = new FormGroup({
    width: new JSTFormControl(DEF_LAND_WIDTH, Validators.required),
    height: new JSTFormControl(DEF_LAND_HEIGHT, Validators.required),
    elevationSid: new JSTFormControl(DEF_ELEVATION_SID, Validators.required),
    humiditySid: new JSTFormControl(DEF_HUMIDITY_SID, Validators.required),
    elevationExp: new JSTFormControl(DEF_ELEVATION_EXPONENT, Validators.required),
    humidityExp: new JSTFormControl(DEF_HUMIDITY_EXPONENT, Validators.required),
  });

  public onGenerate(): void {
    if (!this.paramsFormGroup.valid) {
      this.paramsFormGroup.markAllAsTouched();
      return;
    }
    this.isGenerating$.next(true);
    const params = this.paramsFormGroup.getRawValue();
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
    this.isGenerating$.next(false);
    this.map$.next(map);
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
        /* const a = 0.1;
        const b = 0.2;
        const c = 2;
        const d = 2 * Math.max(Math.abs(nx), Math.abs(ny)); // Manhattan distance
        // const d = 2 * Math.sqrt(nx * nx + ny * ny); // Euclidian distance
        // e = (e + a - b * d) ^ c;
        // add
        //e = e + 0.05 + 1 * Math.pow(d, 2); */

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
