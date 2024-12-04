/* eslint-disable @typescript-eslint/no-magic-numbers */
export class ColorHelper {
  public static rgb2hex(value: string): string {
    const rgb = value.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return rgb && rgb.length === 4
      ? '#' +
          ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) +
          ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) +
          ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2)
      : '';
  }

  public static hex2hexadecimal(val: string): number {
    try {
      return parseInt(val.split('#')[1], 16);
    } catch (error) {
      return 0;
    }
  }

  public static hex2rgba(val: string): string {
    const bigint = parseInt(val.split('#')[1], 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},1)`;
  }
}
