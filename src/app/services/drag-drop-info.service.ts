import { Injectable } from '@angular/core';

import { IDragInfo } from '~interfaces/drag.interface';

@Injectable({ providedIn: 'root' })
export class DragDropInfoService {
  dragInfo: IDragInfo | null = null;
}
