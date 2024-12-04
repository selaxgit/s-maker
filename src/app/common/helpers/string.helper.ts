export class StringHelper {
  public static string2number(value: string | null): number | null {
    let id: number | null = null;
    if (value !== null) {
      id = parseInt(value, 10);
      if (isNaN(id)) {
        id = null;
      }
    }
    return id;
  }

  public static base64ToUint8(base64str: string): Uint8Array {
    const binary = atob(base64str.replace(/\s/g, ''));
    const len = binary.length;
    const buffer = new ArrayBuffer(len);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < len; i++) {
      view[i] = binary.charCodeAt(i);
    }
    return view;
  }

  public static replaceHyphen(hyphen: string): string {
    return hyphen
      .split('-')
      .map((i: string) => StringHelper.upperCaseFirstLetter(i))
      .join('');
  }

  public static lowerCaseFirstLetter(str: string): string {
    return str ? str[0].toLowerCase() + str.substring(1) : str;
  }

  public static upperCaseFirstLetter(str: string): string {
    return str ? str[0].toUpperCase() + str.substring(1) : str;
  }
}
