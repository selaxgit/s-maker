import { forkJoin, map, Observable, of, Subscriber, switchMap } from 'rxjs';

export abstract class DBBase<T extends { id: number; projectId?: number }> {
  protected abstract tableName: string;

  protected readonly dbVersion = 1;

  protected readonly dbName: string = 's-maker-db-v4';

  protected readonly dbTables: string[] = [
    'projects',
    'frames-tree',
    'frames',
    'sprites-tree',
    'sprites',
    'sprites-tree',
    'sprites-layers',
    'sprites-frames',
    'sprites-animations',
    'tiles-grid',
    'tiles-grid-bg',
    'scenes',
    'scenes-objects',
  ];

  public removeByFilter(filter: (item: T) => boolean): Observable<void> {
    return this.getListByFilter(filter).pipe(
      switchMap((values: T[]) => {
        return this.batchRemove(values.map((item: T) => item.id)).pipe(switchMap(() => of(undefined)));
      }),
    );
  }

  public getListByFilter(filter: (item: T) => boolean): Observable<T[]> {
    return this.getList().pipe(map((response: T[]) => response.filter((item: T) => filter(item))));
  }

  public getByFilter(filter: (item: T) => boolean): Observable<T | null> {
    return this.getList().pipe(map((response: T[]) => response.find((item: T) => filter(item)) ?? null));
  }

  public batchUpdate(ids: number[], data: Partial<T>): Observable<void> {
    if (ids.length === 0) {
      return of(undefined);
    }
    const forks: Observable<T>[] = [];
    ids.forEach((id: number) => {
      forks.push(this.update(id, data));
    });
    if (forks.length === 0) {
      return of(undefined);
    }
    return forkJoin(forks).pipe(switchMap(() => of(undefined)));
  }

  public update(id: number, data: Partial<T>): Observable<T> {
    return this.get(id).pipe(
      switchMap((response: T) => this.updateData({ ...response, ...data })),
      switchMap(() => this.get(id)),
    );
  }

  public get(id: number): Observable<T> {
    return new Observable<T>((observer: Subscriber<T>) => {
      this.openDB().subscribe({
        next: (db: IDBDatabase) => {
          try {
            const transaction = db.transaction(this.tableName, 'readwrite');
            const objectStore = transaction.objectStore(this.tableName);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            objectStore.get(Number(id)).onsuccess = (e: any) => {
              db.close();
              observer.next(e.target.result ?? null);
              observer.complete();
            };
          } catch (e) {
            observer.error(e);
          }
        },
        error: (e: Error) => {
          observer.error(e);
        },
      });
    });
  }

  public batchRemove(ids: number[]): Observable<void> {
    if (ids.length === 0) {
      return of(undefined);
    }
    const forks: Observable<void>[] = [];
    ids.forEach((id: number) => {
      forks.push(this.remove(id));
    });
    if (forks.length === 0) {
      return of(undefined);
    }
    return forkJoin(forks).pipe(switchMap(() => of(undefined)));
  }

  public remove(id: number): Observable<void> {
    return new Observable<void>((observer: Subscriber<void>) => {
      this.openDB().subscribe({
        next: (db: IDBDatabase) => {
          const transaction = db.transaction(this.tableName, 'readwrite');
          const objectStore = transaction.objectStore(this.tableName);
          transaction.oncomplete = () => {
            observer.next();
            observer.complete();
          };
          objectStore.delete(id).onsuccess = () => {
            db.close();
          };
        },
        error: (e: Error) => {
          observer.error(e);
        },
      });
    });
  }

  public insert(data: Partial<T>): Observable<T> {
    return this.openDB().pipe(
      switchMap((db: IDBDatabase) => this.insertDB(db, data)),
      switchMap((id: number) => this.get(id)),
    );
  }

  public getList(): Observable<T[]> {
    return new Observable<T[]>((observer: Subscriber<T[]>) => {
      this.openDB().subscribe({
        next: (db: IDBDatabase) => {
          const list: T[] = [];
          const transaction = db.transaction(this.tableName);
          const objectStore = transaction.objectStore(this.tableName);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transaction.onerror = (e: any) => observer.error(e);
          transaction.oncomplete = () => {
            observer.next(list);
            observer.complete();
          };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          objectStore.getAll().onsuccess = (e: any) => {
            if (e.target.result) {
              list.push(...e.target.result);
            }
            db.close();
          };
        },
        error: (e: Error) => {
          observer.error(e);
        },
      });
    });
  }

  protected openDB(): Observable<IDBDatabase> {
    return new Observable<IDBDatabase>((observer: Subscriber<IDBDatabase>) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request.onerror = (event: any) => {
        observer.error(event.target.message);
      };
      request.onblocked = () => observer.error('База заблокирована');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        this.dbTables.forEach((table: string) => {
          if (!db.objectStoreNames.contains(table)) {
            db.createObjectStore(table, {
              keyPath: 'id',
              autoIncrement: true,
            });
          }
        });
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        observer.next(db);
        observer.complete();
      };
    });
  }

  public updateData(data: T): Observable<void> {
    return new Observable<void>((observer: Subscriber<void>) => {
      this.openDB().subscribe({
        next: (db: IDBDatabase) => {
          const transaction = db.transaction([this.tableName], 'readwrite');
          transaction.oncomplete = () => {
            observer.next();
            observer.complete();
          };
          const objectStore = transaction.objectStore(this.tableName);
          objectStore.put(data);
          db.close();
        },
        error: (e: Error) => {
          observer.error(e);
        },
      });
    });
  }

  private insertDB(db: IDBDatabase, data: Partial<T>): Observable<number> {
    return new Observable<number>((observer: Subscriber<number>) => {
      let newId = 0;
      const transaction = db.transaction([this.tableName], 'readwrite');
      transaction.oncomplete = () => {
        observer.next(newId);
        observer.complete();
      };
      const objectStore = transaction.objectStore(this.tableName);
      const objectStoreRequest = objectStore.add(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      objectStoreRequest.onsuccess = (e: any) => {
        newId = e.target?.result;
      };
      db.close();
    });
  }
}
