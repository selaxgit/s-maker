import { InjectionToken } from '@angular/core';

import { ITreeService, ITreeStore } from '~interfaces/tree.interface';

export const TREE_FRAMES_SERVICE_TOKEN = new InjectionToken<ITreeService>('TreeService');
export const TREE_FRAMES_STORE_TOKEN = new InjectionToken<ITreeStore>('TreeStore');
