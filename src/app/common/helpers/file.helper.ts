import { Observable, Subscriber } from 'rxjs';

import { Pixelmatch } from '../classes';
import { CanvasHelper } from './canvas.helper';

export interface IDimensions {
  width: number;
  height: number;
}

export class FileHelper {
  public static fileToImageDate(file: File): Promise<ImageData> {
    return new Promise<ImageData>(
      (resolve: (value: ImageData | PromiseLike<ImageData>) => void, reject: (reason?: Error) => void) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Что-то пошло не так'));
        } else {
          const imgElement = new Image();
          imgElement.src = URL.createObjectURL(file);
          imgElement.onload = () => {
            canvas.width = imgElement.width;
            canvas.height = imgElement.height;
            ctx.drawImage(imgElement, 0, 0);
            URL.revokeObjectURL(imgElement.src);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            resolve(data);
          };
        }
      },
    );
  }

  public static async compareFiles(file1: File, file2: File): Promise<boolean> {
    const data1 = await FileHelper.fileToImageDate(file1);
    const data2 = await FileHelper.fileToImageDate(file2);

    const pixelmatch = new Pixelmatch(data1, data2, data1.width, data1.height);
    const pixels = pixelmatch.compare();
    return pixels < 10;
  }

  public static blobToFile(blob: Blob, filename: string): File {
    return new File([blob], filename, {
      lastModified: new Date().getTime(),
      type: blob.type,
    });
  }

  public static getFileDimensions(file: File): Promise<IDimensions> {
    return new Promise((resolve: (value: IDimensions | PromiseLike<IDimensions>) => void) => {
      const imgElement = new Image();
      imgElement.src = URL.createObjectURL(file);
      imgElement.onload = () => {
        resolve({
          width: imgElement.naturalWidth,
          height: imgElement.naturalHeight,
        });
        URL.revokeObjectURL(imgElement.src);
      };
    });
  }

  public static uploadFile<T extends File | FileList>(accept?: string, multiple?: boolean): Observable<T> {
    return new Observable<T>((observer: Subscriber<T>) => {
      if (!accept) {
        accept = '*';
      }
      if (multiple === undefined) {
        multiple = false;
      }
      const inputElement = document.createElement('input');
      inputElement.setAttribute('type', 'file');
      inputElement.setAttribute('accept', accept);
      if (multiple) {
        inputElement.setAttribute('multiple', 'multiple');
      }
      inputElement.addEventListener(
        'change',
        () => {
          if (inputElement && inputElement.files && inputElement.files.length > 0) {
            if (multiple) {
              observer.next(inputElement.files as T);
              observer.complete();
            } else {
              observer.next(inputElement.files[0] as T);
              observer.complete();
            }
          } else {
            observer.error('Нет файлов');
          }
        },
        { once: true },
      );
      inputElement.click();
    });
  }

  public static downloadJson(json: object, filename: string): void {
    const link = document.createElement('a');
    link.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json, null, 2)));
    link.setAttribute('download', filename);
    link.click();
  }

  public static async flipFile(file: File, flipHorizontal: boolean, flipVertical: boolean): Promise<File> {
    let canvas = await CanvasHelper.fileToCanvas(file);
    if (flipHorizontal) {
      canvas = CanvasHelper.canvasFlipHorizontal(canvas);
    }
    if (flipVertical) {
      canvas = CanvasHelper.canvasFlipVertical(canvas);
    }
    const blob = await CanvasHelper.canvasToBlob(canvas);
    return new File([blob], file.name);
  }
}
