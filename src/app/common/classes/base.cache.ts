export abstract class BaseCache<K extends { id: number }, T extends { objectURL?: string }> {
  protected cacheStore: Map<number, T> = new Map();

  public batchRemoveCache(ids: number[]): void {
    for (const id of ids) {
      this.removeCache(id);
    }
  }

  public removeCache(id: number): void {
    if (!this.cacheStore.has(id)) {
      return;
    }
    const item = this.cacheStore.get(id) as T;
    if (item.objectURL) {
      URL.revokeObjectURL(item.objectURL);
    }
    this.cacheStore.delete(id);
  }

  public async getCacheByItems(items: K[]): Promise<T[]> {
    const ret: T[] = [];
    for (const item of items) {
      ret.push(await this.getCache(item));
    }
    return ret;
  }

  public async getCache(item: K): Promise<T> {
    if (this.cacheStore.has(item.id)) {
      return this.cacheStore.get(item.id) as T;
    }
    return this.setCache(item);
  }

  public clear(): void {
    this.cacheStore.forEach((item: T) => {
      if (item.objectURL) {
        URL.revokeObjectURL(item.objectURL);
      }
    });
    this.cacheStore.clear();
  }

  public clearCacheById(id: number): void {
    if (this.cacheStore.has(id)) {
      const item = this.cacheStore.get(id);
      if (item?.objectURL) {
        URL.revokeObjectURL(item.objectURL);
      }
      this.cacheStore.delete(id);
    }
  }

  protected abstract setCache(item: K): Promise<T>;
}
