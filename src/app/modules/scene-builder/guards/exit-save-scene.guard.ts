import { inject } from '@angular/core';
import { SConfirmAlignButtonsEnum, SDialogService } from '@selax/ui';
import { Observable, of, switchMap } from 'rxjs';

import { ScenesFacade } from '~core/facade';

export const ExitSaveSceneGuard = (): Observable<boolean> => {
  const scenesFacade = inject(ScenesFacade);
  if (!scenesFacade.hasChanged()) {
    scenesFacade.resetEditScene();
    return of(true);
  }
  const dialogService = inject(SDialogService);
  return dialogService
    .showCustomConfirm<number>(
      'Текущая сцена не сохранена',
      'Подтверждение перехода',
      [
        {
          title: 'Сохранить сцену и перейти',
          color: 'primary',
          value: 1,
        },
        {
          title: 'Перейти без сохранения',
          color: 'warn',
          value: 2,
        },
        {
          title: 'Отменить переход',
          color: 'accent',
          value: 3,
        },
      ],
      SConfirmAlignButtonsEnum.Vertical,
    )
    .pipe(
      switchMap((button: number | undefined) => {
        switch (button) {
          case 1:
            return scenesFacade.saveScene().pipe(
              switchMap(() => {
                scenesFacade.resetEditScene();
                return of(true);
              }),
            );
          case 2:
            scenesFacade.resetEditScene();
            return of(true);
          default:
            return of(false);
        }
      }),
    );
};
