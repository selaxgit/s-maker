import { SMCDragTypeEnum, SMCDropPositionEnum } from '~constants/drag.constants';

export interface IDragInfo {
  type: SMCDragTypeEnum;
  value: unknown;
}

export interface IDropInfo {
  dropPosition: SMCDropPositionEnum;
  dragInfo: IDragInfo;
}
