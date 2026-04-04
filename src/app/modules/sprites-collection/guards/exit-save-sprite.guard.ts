import { inject } from '@angular/core';
import { SConfirmAlignButtonsEnum, SDialogService } from '@selax/ui';
import { Observable, of, switchMap } from 'rxjs';

import { EditSpriteFacade } from '~core/facade';

export const ExitSaveSpriteGuard = (): Observable<boolean> => {
  const editSpriteFacade = inject(EditSpriteFacade);
  if (!editSpriteFacade.hasChanged()) {
    editSpriteFacade.reset();
    return of(true);
  }
  const dialogService = inject(SDialogService);
  return dialogService
    .showCustomConfirm<number>(
      'Текущий спрайт не сохранен',
      'Подтверждение перехода',
      [
        {
          title: 'Сохранить спрайт и перейти',
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
            return editSpriteFacade.saveSprite().pipe(
              switchMap(() => {
                editSpriteFacade.reset();
                return of(true);
              }),
            );
          case 2:
            editSpriteFacade.reset();
            return of(true);
          default:
            return of(false);
        }
      }),
    );
};
