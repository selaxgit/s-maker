import { AbstractControl, ValidationErrors } from '@angular/forms';

export function SMCCustomUniqueValidator(
  validatorFn: (value: string) => boolean,
  errorMessage: string = 'Значение не является уникальным',
): (control: AbstractControl) => ValidationErrors | null {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || control.value.trim() === '') {
      return null;
    }

    const isValid = validatorFn(control.value);
    return isValid ? null : { customUnique: { message: errorMessage, value: control.value } };
  };
}
