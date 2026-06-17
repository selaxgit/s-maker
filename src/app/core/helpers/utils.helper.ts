export class UtilsHelper {
  static isEmptyObject(obj: unknown): boolean {
    if (typeof obj !== 'object' || obj === null) {
      return true;
    }
    if (Array.isArray(obj)) {
      return obj.length === 0;
    }
    return Object.keys(obj).length === 0;
  }

  static hasRecordValue(record: Record<string, number | null>): boolean {
    return Object.values(record).some((value: number | null) => value !== null);
  }
}
