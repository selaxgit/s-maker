import { IRect } from '../interfaces';

export interface ICalcScaleImage {
  width: number;
  height: number;
  left: number;
  top: number;
  scaleTotargetWidth: boolean;
}

export class CanvasHelper {
  public static canvasFlipHorizontal(source: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(source, -canvas.width, 0);
      ctx.restore();
    }
    return canvas;
  }

  public static canvasFlipVertical(source: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.scale(1, -1);
      ctx.drawImage(source, 0, -canvas.height);
      ctx.restore();
    }
    return canvas;
  }

  public static async cropCanvasToFile(
    fileName: string,
    canvasSource: HTMLCanvasElement,
    rect: IRect,
  ): Promise<File | null> {
    const canvasDest = document.createElement('canvas');
    canvasDest.width = rect.width;
    canvasDest.height = rect.height;
    const ctxDest = canvasDest.getContext('2d');
    const ctxSource = canvasSource.getContext('2d');
    if (!ctxDest || !ctxSource) {
      return null;
    }
    const imageData = ctxSource.getImageData(rect.x, rect.y, rect.width, rect.height);
    ctxDest.putImageData(imageData, 0, 0);
    const blob = await CanvasHelper.canvasToBlob(canvasDest);
    return new File([blob], `${fileName}.png`);
  }

  public static async canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise<Blob>((resolve: (value: Blob | PromiseLike<Blob>) => void, reject: (reason?: Error) => void) => {
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Что-то пошло не так'));
        }
      });
    });
  }

  public static async fileToCanvas(file: File, width?: number, height?: number): Promise<HTMLCanvasElement> {
    return new Promise<HTMLCanvasElement>(
      (
        resolve: (value: HTMLCanvasElement | PromiseLike<HTMLCanvasElement>) => void,
        reject: (reason?: Error) => void,
      ) => {
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
            if (width === undefined && height === undefined) {
              resolve(canvas);
            } else {
              const targetCanvas = document.createElement('canvas');
              const targetCtx = targetCanvas.getContext('2d');
              if (!targetCtx) {
                reject(new Error('Что-то пошло не так'));
              } else {
                const targetWidth = width ?? canvas.width;
                const targetHeight = height ?? canvas.height;
                targetCanvas.width = targetWidth;
                targetCanvas.height = targetHeight;
                const scaleImage = CanvasHelper.calcScaleImage(canvas.width, canvas.height, targetWidth, targetHeight);
                targetCtx.drawImage(canvas, scaleImage.left, scaleImage.top, scaleImage.width, scaleImage.height);
                resolve(targetCanvas);
              }
            }
          };
        }
      },
    );
  }

  public static calcScaleImage(
    srcWidth: number,
    srcHeight: number,
    targetWidth: number,
    targetHeight: number,
    mode: 'fitted' | 'zoom' = 'fitted',
  ): ICalcScaleImage {
    const ret: ICalcScaleImage = {
      width: 0,
      height: 0,
      left: 0,
      top: 0,
      scaleTotargetWidth: true,
    };

    if (srcWidth <= 0 || srcHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
      return ret;
    }
    const scaleX1 = targetWidth;
    const scaleY1 = (srcHeight * targetWidth) / srcWidth;
    const scaleX2 = (srcWidth * targetHeight) / srcHeight;
    const scaleY2 = targetHeight;
    var fScaleOnWidth = scaleX2 > targetWidth;
    if (fScaleOnWidth) {
      fScaleOnWidth = mode === 'fitted';
    } else {
      fScaleOnWidth = mode === 'zoom';
    }
    if (fScaleOnWidth) {
      ret.width = Math.floor(scaleX1);
      ret.height = Math.floor(scaleY1);
      ret.scaleTotargetWidth = true;
    } else {
      ret.width = Math.floor(scaleX2);
      ret.height = Math.floor(scaleY2);
      ret.scaleTotargetWidth = false;
    }
    ret.left = Math.floor((targetWidth - ret.width) / 2);
    ret.top = Math.floor((targetHeight - ret.height) / 2);
    return ret;
  }

  public static drawFileOnCanvas(
    canvas: HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number,
    file: File,
  ): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (reason?: Error) => void) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Что-то пошло не так'));
      } else {
        const imgElement = new Image();
        imgElement.src = URL.createObjectURL(file);
        imgElement.onload = () => {
          ctx.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height, x, y, width, height);
          URL.revokeObjectURL(imgElement.src);
          resolve();
        };
      }
    });
  }

  public static arrayBufferToCanvas(buffer: ArrayBuffer): Promise<HTMLCanvasElement> {
    return new Promise<HTMLCanvasElement>(
      (
        resolve: (value: HTMLCanvasElement | PromiseLike<HTMLCanvasElement>) => void,
        reject: (reason?: Error) => void,
      ) => {
        const blob = new Blob([buffer], { type: 'image/png' });
        const imgElement = new Image();
        imgElement.src = URL.createObjectURL(blob);
        imgElement.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(imgElement.src);
            reject(new Error('Что-то пошло не так'));
          } else {
            canvas.width = imgElement.width;
            canvas.height = imgElement.height;
            ctx.drawImage(imgElement, 0, 0);
            URL.revokeObjectURL(imgElement.src);
            resolve(canvas);
          }
        };
      },
    );
  }
}
