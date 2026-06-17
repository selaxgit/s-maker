import { inject, Injectable } from '@angular/core';
import { SDialogService } from '@selax/ui';

import { ExportSpriteTypeEnum } from '~constants/sprite.constants';
import { ExportSceneTypeEnum } from '~core/constants';
import { ExportGridService, ExportProjectService, ExportSceneService, ExportSpriteService } from '~core/services';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  private readonly dialogService = inject(SDialogService);

  private readonly exportProjectService = inject(ExportProjectService);

  private readonly exportSpriteService = inject(ExportSpriteService);

  private readonly exportGridService = inject(ExportGridService);

  private readonly exportSceneService = inject(ExportSceneService);

  async exportScene(sceneId: number, type: ExportSceneTypeEnum): Promise<void> {
    try {
      this.dialogService.showWait('Экспорт сцены...');
      await this.exportSceneService.exportScene(sceneId, type);
      const errorsLog = this.exportSceneService.getErrorsLog();
      if (errorsLog.length === 0) {
        const msg =
          type === ExportSceneTypeEnum.Full ? 'Архив отправлен на скачивание' : 'Файл отправлен на скачивание';
        this.dialogService.showToastSuccess(`Экспорт сцены прошел успешно.<br />${msg}`);
      } else {
        this.dialogService.showToastWarning('Экспорт сцены прошел с ошибками:<br>' + errorsLog.join('<br />'));
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        this.dialogService.showToastError(e.message || 'Ошибка при экспорте сцены');
      } else {
        this.dialogService.showToastError('Ошибка при экспорте сцены');
      }
    } finally {
      this.dialogService.hideWait();
    }
  }

  async exportGrid(gridId: number): Promise<void> {
    try {
      this.dialogService.showWait('Экспорт сетки тайлов...');
      await this.exportGridService.exportGrid(gridId);
      const errorsLog = this.exportGridService.getErrorsLog();
      if (errorsLog.length === 0) {
        this.dialogService.showToastSuccess('Экспорт сетки тайлов прошел успешно.<br />Архив отправлен на скачивание');
      } else {
        this.dialogService.showToastWarning('Экспорт сетки тайлов прошел с ошибками:<br>' + errorsLog.join('<br />'));
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        this.dialogService.showToastError(e.message || 'Ошибка при экспорте сетки тайлов');
      } else {
        this.dialogService.showToastError('Ошибка при экспорте сетки тайлов');
      }
    } finally {
      this.dialogService.hideWait();
    }
  }

  async exportSprite(spriteId: number, type: ExportSpriteTypeEnum): Promise<void> {
    try {
      this.dialogService.showWait('Экспорт спрайта...');
      await this.exportSpriteService.exportSprite(spriteId, type);
      const errorsLog = this.exportSpriteService.getErrorsLog();
      if (errorsLog.length === 0) {
        this.dialogService.showToastSuccess('Экспорт спрайта прошел успешно.<br />Архив отправлен на скачивание');
      } else {
        this.dialogService.showToastWarning('Экспорт спрайта прошел с ошибками:<br>' + errorsLog.join('<br />'));
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        this.dialogService.showToastError(e.message || 'Ошибка при экспорте спрайта');
      } else {
        this.dialogService.showToastError('Ошибка при экспорте спрайта');
      }
    } finally {
      this.dialogService.hideWait();
    }
  }

  async exportProject(projectId: number): Promise<void> {
    try {
      this.dialogService.showWait('Экспорт проекта...');
      await this.exportProjectService.exportProject(projectId);
      this.dialogService.showToastSuccess('Экспорт проекта прошел успешно.<br />Архив отправлен на скачивание');
    } catch (e: unknown) {
      if (e instanceof Error) {
        this.dialogService.showToastError(e.message || 'Ошибка при экспорте проекта');
      } else {
        this.dialogService.showToastError('Ошибка при экспорте проекта');
      }
    } finally {
      this.dialogService.hideWait();
    }
  }
}
