import { Injectable } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';

import { DBBase } from '../../classes';
import { FileHelper, IDimensions } from '../../helpers';
import { IFrame } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class FramesDBService extends DBBase<IFrame> {
  protected readonly tableName = 'frames';

  public add(projectId: number, treeId: number | null, file: File, name: string | null = null): Observable<IFrame> {
    const filename = file.name.split('.').slice(0, -1).join('.');
    return from(FileHelper.getFileDimensions(file)).pipe(
      switchMap((dimensions: IDimensions) =>
        this.insert({
          projectId,
          treeId,
          name: name ?? filename,
          file,
          width: dimensions.width,
          height: dimensions.height,
        }),
      ),
    );
  }
}
