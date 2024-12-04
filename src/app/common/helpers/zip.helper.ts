import JSZip from 'jszip';

import { CanvasHelper } from './canvas.helper';

export class ZipHelper {
  public static async getFileFromZip(zipData: JSZip, zipFilename: string, filename: string): Promise<File | null> {
    const blob = await zipData.file(zipFilename)?.async('blob');
    if (!blob) {
      return null;
    }
    return new File([blob], filename, {
      lastModified: new Date().getTime(),
      type: blob.type,
    });
  }

  public static async getJSONFromZip<T>(zipData: JSZip, filename: string): Promise<T | null> {
    const content = await zipData.file(filename)?.async('string');
    if (!content) {
      return null;
    }
    try {
      return JSON.parse(content) as T;
    } catch (e) {
      return null;
    }
  }

  public static async getCanvasFromZip(zipData: JSZip, filename: string): Promise<HTMLCanvasElement | null> {
    const blob = await zipData.file(filename)?.async('arraybuffer');
    if (!blob) {
      return null;
    }
    return CanvasHelper.arrayBufferToCanvas(blob);
  }
}
