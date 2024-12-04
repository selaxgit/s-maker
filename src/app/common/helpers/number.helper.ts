export class NumberHelper {
  public static isNumber(n: unknown): boolean {
    return !isNaN(parseFloat(String(n)));
  }

  public static getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
