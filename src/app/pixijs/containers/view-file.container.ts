import { SUCanvasHelper } from '@selax/utils';
import { Container, DestroyOptions, Sprite, Texture } from 'pixi.js';

interface ILastFileInfo {
  name: string;
  size: number;
}

export class ViewFileContainer extends Container {
  private fileSprite: Sprite | null = null;

  private lastFileInfo: ILastFileInfo | null = null;

  override destroy(options?: DestroyOptions): void {
    if (this.fileSprite) {
      this.fileSprite.destroy(true);
      this.fileSprite = null;
    }
    super.destroy(options);
  }

  async setFile(file: File | null): Promise<void> {
    if (!this.compareLastFile(file)) {
      this.setLastFile(file);
      await this.setSprite(file);
    }
  }

  private async setSprite(file: File | null): Promise<void> {
    if (this.fileSprite) {
      this.removeChild(this.fileSprite);
      this.fileSprite.destroy(true);
      this.fileSprite = null;
    }
    if (file) {
      try {
        const canvas = await SUCanvasHelper.fileToCanvas(file);
        this.fileSprite = new Sprite(Texture.from(canvas));
        this.addChild(this.fileSprite);
      } catch (error) {
        console.error('setSprite error:', file, error);
      }
    }
  }

  private setLastFile(file: File | null): void {
    if (file) {
      this.lastFileInfo = {
        name: file.name,
        size: file.size,
      };
    } else {
      this.lastFileInfo = null;
    }
  }

  private compareLastFile(file: File | null): boolean {
    if (!this.lastFileInfo || !file) {
      return false;
    }
    return this.lastFileInfo.name === file.name && this.lastFileInfo.size === file.size;
  }
}
