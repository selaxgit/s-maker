import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ISMCListItem } from './interfaces';

@Component({
  selector: 'smc-list-items-container',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './list-items-container.html',
  styleUrl: './list-items-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SMCListItemsContainer {
  readonly loadingState = input<boolean>(false);

  readonly items = input<ISMCListItem[]>([]);

  readonly listTitle = input<string>('Заголовок');

  readonly noDataMessage = input<string>('Нет данных');

  readonly addButtonTitle = input<string>('Добавить');

  readonly visibleDownloadButton = input<boolean>(false);

  readonly addItemEvent = output<void>();

  readonly downloadItemEvent = output<ISMCListItem>();

  readonly editItemEvent = output<ISMCListItem>();

  readonly removeItemEvent = output<ISMCListItem>();

  handleAddButtonClick(): void {
    this.addItemEvent.emit();
  }

  handleDownloadButtonClick(item: ISMCListItem): void {
    this.downloadItemEvent.emit(item);
  }

  handleEditButtonClick(item: ISMCListItem): void {
    this.editItemEvent.emit(item);
  }

  handleRemoveButtonClick(item: ISMCListItem): void {
    this.removeItemEvent.emit(item);
  }
}
