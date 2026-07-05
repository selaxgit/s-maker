/* eslint-disable @typescript-eslint/no-empty-function */
import { Container, FederatedPointerEvent } from 'pixi.js';

import { SceneLayerTypeEnum } from '~core/constants';
import { SceneObjectType } from '~core/interfaces';
import { IDragStart } from '~pixijs/pixi.app';

import { SBDrawSceneService } from '../../services';
import { ResizeCursorType } from './constants';

export abstract class BaseObjectContainer extends Container {
  objectCursor: ResizeCursorType | null = null;

  captureObject = false;

  constructor(
    readonly typeLayer: SceneLayerTypeEnum,
    readonly guidLayer: string,
    readonly guidObject: string,
    protected readonly drawSceneService: SBDrawSceneService | null = null,
  ) {
    super();
  }

  getX(): number {
    return this.x;
  }

  getY(): number {
    return this.y;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  setX(value: number): void {
    this.x = value;
  }

  setY(value: number): void {
    this.y = value;
  }

  setWidth(_: number): void {}

  setHeight(_: number): void {}

  dragObject(dx: number, dy: number, dragStart: IDragStart): void {
    this.x = dx + dragStart.objectX;
    this.y = dy + dragStart.objectY;
  }

  abstract selectObject(selected: boolean): void;

  abstract drawObject(objectInfo: SceneObjectType): Promise<void>;

  abstract getObjectAtCursor(e: FederatedPointerEvent): BaseObjectContainer | null;
}
