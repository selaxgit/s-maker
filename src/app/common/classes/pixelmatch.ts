/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-len */
/**
 * Благодарность https://github.com/mapbox/pixelmatch
 */

const DEFAULT_OPTIONS = {
  threshold: 0.1, // matching threshold (0 to 1); smaller is more sensitive
  includeAA: false, // whether to skip anti-aliasing detection
  alpha: 0.1, // opacity of original image in diff output
  aaColor: [255, 255, 0], // color of anti-aliased pixels in diff output
  diffColor: [255, 0, 0], // color of different pixels in diff output
  diffColorAlt: null, // whether to detect dark on light differences between img1 and img2 and set an alternative color to differentiate between the two
  diffMask: false, // draw the diff over a transparent background (a mask)
};

export class Pixelmatch {
  constructor(
    private data1: ImageData,
    private data2: ImageData,
    private width: number,
    private height: number,
  ) {}

  public compare(): number {
    const img1 = this.data1.data;
    const img2 = this.data2.data;
    const options = DEFAULT_OPTIONS;
    const len = this.width * this.height;
    const a32 = new Uint32Array(img1.buffer, img1.byteOffset, len);
    const b32 = new Uint32Array(img2.buffer, img2.byteOffset, len);
    let identical = true;
    for (let i = 0; i < len; i++) {
      if (a32[i] !== b32[i]) {
        identical = false;
        break;
      }
    }
    if (identical) {
      return 0;
    }
    // maximum acceptable square distance between two colors;
    // 35215 is the maximum possible value for the YIQ difference metric
    const maxDelta = 35215 * options.threshold * options.threshold;
    let diff = 0;
    // compare each pixel of one image against the other one
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const pos = (y * this.width + x) * 4;

        // squared YUV distance between colors at this pixel position, negative if the img2 pixel is darker
        const delta = this.colorDelta(img1, img2, pos, pos, false);

        // the color difference is above the threshold
        if (Math.abs(delta) > maxDelta) {
          // check it's a real rendering difference or just anti-aliasing
          if (
            !options.includeAA &&
            (this.antialiased(img1, x, y, this.width, this.height, img2) ||
              this.antialiased(img2, x, y, this.width, this.height, img1))
          ) {
            // one of the pixels is anti-aliasing; draw as yellow and do not count as difference
            // note that we do not include such pixels in a mask
          } else {
            // found substantial difference not caused by anti-aliasing; draw it as such
            diff++;
          }
        }
      }
    }

    // return the number of different pixels
    return diff;
  }

  private antialiased(
    img: Uint8ClampedArray,
    x1: number,
    y1: number,
    width: number,
    height: number,
    img2: Uint8ClampedArray,
  ): boolean {
    const x0 = Math.max(x1 - 1, 0);
    const y0 = Math.max(y1 - 1, 0);
    const x2 = Math.min(x1 + 1, width - 1);
    const y2 = Math.min(y1 + 1, height - 1);
    const pos = (y1 * width + x1) * 4;
    let zeroes = x1 === x0 || x1 === x2 || y1 === y0 || y1 === y2 ? 1 : 0;
    let min = 0;
    let max = 0;
    let minX = 0;
    let minY = 0;
    let maxX = 0;
    let maxY = 0;

    // go through 8 adjacent pixels
    for (let x = x0; x <= x2; x++) {
      for (let y = y0; y <= y2; y++) {
        if (x === x1 && y === y1) continue;

        // brightness delta between the center pixel and adjacent one
        const delta = this.colorDelta(img, img, pos, (y * width + x) * 4, true);

        // count the number of equal, darker and brighter adjacent pixels
        if (delta === 0) {
          zeroes++;
          // if found more than 2 equal siblings, it's definitely not anti-aliasing
          if (zeroes > 2) return false;

          // remember the darkest pixel
        } else if (delta < min) {
          min = delta;
          minX = x;
          minY = y;

          // remember the brightest pixel
        } else if (delta > max) {
          max = delta;
          maxX = x;
          maxY = y;
        }
      }
    }

    // if there are no both darker and brighter pixels among siblings, it's not anti-aliasing
    if (min === 0 || max === 0) return false;

    // if either the darkest or the brightest pixel has 3+ equal siblings in both images
    // (definitely not anti-aliased), this pixel is anti-aliased
    return (
      (this.hasManySiblings(img, minX, minY, width, height) && this.hasManySiblings(img2, minX, minY, width, height)) ||
      (this.hasManySiblings(img, maxX, maxY, width, height) && this.hasManySiblings(img2, maxX, maxY, width, height))
    );
  }

  private hasManySiblings(img: Uint8ClampedArray, x1: number, y1: number, width: number, height: number): boolean {
    const x0 = Math.max(x1 - 1, 0);
    const y0 = Math.max(y1 - 1, 0);
    const x2 = Math.min(x1 + 1, width - 1);
    const y2 = Math.min(y1 + 1, height - 1);
    const pos = (y1 * width + x1) * 4;
    let zeroes = x1 === x0 || x1 === x2 || y1 === y0 || y1 === y2 ? 1 : 0;

    // go through 8 adjacent pixels
    for (let x = x0; x <= x2; x++) {
      for (let y = y0; y <= y2; y++) {
        if (x === x1 && y === y1) continue;

        const pos2 = (y * width + x) * 4;
        if (
          img[pos] === img[pos2] &&
          img[pos + 1] === img[pos2 + 1] &&
          img[pos + 2] === img[pos2 + 2] &&
          img[pos + 3] === img[pos2 + 3]
        )
          zeroes++;

        if (zeroes > 2) return true;
      }
    }

    return false;
  }

  private colorDelta(img1: Uint8ClampedArray, img2: Uint8ClampedArray, k: number, m: number, yOnly: boolean): number {
    let r1 = img1[k + 0];
    let g1 = img1[k + 1];
    let b1 = img1[k + 2];
    let a1 = img1[k + 3];

    let r2 = img2[m + 0];
    let g2 = img2[m + 1];
    let b2 = img2[m + 2];
    let a2 = img2[m + 3];

    if (a1 === a2 && r1 === r2 && g1 === g2 && b1 === b2) return 0;

    if (a1 < 255) {
      a1 /= 255;
      r1 = this.blend(r1, a1);
      g1 = this.blend(g1, a1);
      b1 = this.blend(b1, a1);
    }

    if (a2 < 255) {
      a2 /= 255;
      r2 = this.blend(r2, a2);
      g2 = this.blend(g2, a2);
      b2 = this.blend(b2, a2);
    }

    const y1 = this.rgb2y(r1, g1, b1);
    const y2 = this.rgb2y(r2, g2, b2);
    const y = y1 - y2;

    if (yOnly) return y; // brightness difference only

    const i = this.rgb2i(r1, g1, b1) - this.rgb2i(r2, g2, b2);
    const q = this.rgb2q(r1, g1, b1) - this.rgb2q(r2, g2, b2);

    const delta = 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q;

    // encode whether the pixel lightens or darkens in the sign
    return y1 > y2 ? -delta : delta;
  }

  private rgb2y(r: number, g: number, b: number): number {
    return r * 0.29889531 + g * 0.58662247 + b * 0.11448223;
  }

  private rgb2i(r: number, g: number, b: number): number {
    return r * 0.59597799 - g * 0.2741761 - b * 0.32180189;
  }

  private rgb2q(r: number, g: number, b: number): number {
    return r * 0.21147017 - g * 0.52261711 + b * 0.31114694;
  }

  // blend semi-transparent color with white
  private blend(c: number, a: number): number {
    return 255 + (c - 255) * a;
  }
}
