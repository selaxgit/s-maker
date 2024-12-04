import { Injectable } from '@angular/core';

export class StorageService {
  constructor(protected readonly storage: Storage) {}

  public get<T>(key: string): T | null {
    const value = this.storage.getItem(key);
    return value ? this.getValue<T>(value) : null;
  }

  public set(key: string, value: unknown): void {
    this.storage.setItem(key, this.normalizeValue(value));
  }

  public remove(key: string): void {
    this.storage.removeItem(key);
  }

  public clear(): void {
    this.storage.clear();
  }

  private getValue<T>(value: string): T {
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      return value as T;
    }
  }

  private normalizeValue(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
}

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService extends StorageService {
  constructor() {
    super(localStorage);
  }
}

@Injectable({
  providedIn: 'root',
})
export class SessionStorageService extends StorageService {
  constructor() {
    super(sessionStorage);
  }
}
