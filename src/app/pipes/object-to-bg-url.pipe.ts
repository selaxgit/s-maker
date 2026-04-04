import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'objectToBgUrl',
  pure: true,
})
export class ObjectToBgUrlPipe implements PipeTransform {
  transform(objectURL: string | null): string {
    return objectURL ? `url(${objectURL})` : 'none';
  }
}
