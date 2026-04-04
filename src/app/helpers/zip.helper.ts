/* eslint-disable unused-imports/no-unused-vars */
import { SUCanvasHelper } from '@selax/utils';
import JSZip from 'jszip';

export class ZipHelper {
  static async getFileFromZip(
    zipData: JSZip,
    zipFilename: string,
    filename: string | null = null,
    filetype: string = 'image/png',
  ): Promise<File | null> {
    const blob = await zipData.file(zipFilename)?.async('blob');
    if (!blob) {
      return null;
    }
    if (!filename) {
      filename = zipFilename;
    }
    return new File([blob], filename, {
      lastModified: new Date().getTime(),
      type: filetype,
    });
  }

  static async getJSONFromZip<T>(zipData: JSZip, filename: string): Promise<T | null> {
    const content = await zipData.file(filename)?.async('string');
    if (!content) {
      return null;
    }
    try {
      return JSON.parse(content) as T;
    } catch (e: unknown) {
      return null;
    }
  }

  static async getCanvasFromZip(zipData: JSZip, filename: string): Promise<HTMLCanvasElement | null> {
    const blob = await zipData.file(filename)?.async('arraybuffer');
    if (!blob) {
      return null;
    }
    return SUCanvasHelper.arrayBufferToCanvas(blob);
  }
}
