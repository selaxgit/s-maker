import { Injectable } from '@angular/core';
import { ISUDimensions, SUDBBase, SUFileHelper } from '@selax/utils';
import { from, Observable, switchMap } from 'rxjs';

import { IFrame } from '~core/interfaces';

@Injectable({ providedIn: 'root' })
export class DBFrames extends SUDBBase<IFrame> {
  protected readonly tableName = 'frames';

  public add(projectId: number, treeId: number | null, file: File, name: string | null = null): Observable<IFrame> {
    const filename = file.name.split('.').slice(0, -1).join('.');
    return from(SUFileHelper.getFileDimensions(file)).pipe(
      switchMap((dimensions: ISUDimensions) =>
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
