import { Container } from 'pixi.js';
import { Subject } from 'rxjs';

import { EditorToolStateType, ISceneObject } from '../../../../../common/interfaces';
import { ICurrentObject } from './constants';

export class BaseLayer extends Container {
  public maxWidth = 0;

  public maxHeight = 0;

  public objectEnterEvent = new Subject<ICurrentObject>();

  public objectLeaveEvent = new Subject<ICurrentObject>();

  protected reverenceId: number | null = null;

  protected toolStateValue: EditorToolStateType = 'move';

  public async updateLayer(object: ISceneObject): Promise<void> {
    this.x = object.x;
    this.y = object.y;
    this.zIndex = object.zIndex;
    this.visible = object.visible;
    this.reverenceId = object.referenceId;
  }

  public set toolState(value: EditorToolStateType) {
    this.toolStateValue = value;
  }
}
