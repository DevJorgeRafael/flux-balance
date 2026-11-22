import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'assets', 'images', 'logos-app');
const sourcePath = join(assetsDir, 'logo-splash.png');
const bodyPath = join(assetsDir, 'logo-splash-body.png');
const coinPath = join(assetsDir, 'logo-splash-coin.png');
const metadataPath = join(assetsDir, 'logo-splash-layers.json');

const COIN_CENTER = { x: 479.5, y: 209.5 };
const COIN_MASK_RADIUS = 130.5;
const COIN_EDGE_RADIUS = 125;
const BODY_MARGIN = 2;
const COIN_CROP = { left: 352, top: 82, width: 256, height: 256 };
const SLOT = { x: 455.5, y: 409 };
const BACK_LINE_PATH =
  'M 330 357 C 380 350 430 341 480 344 C 530 347 580 355 630 372';
const BACK_LINE_WIDTH = 29;
const OUTLINE_SMOOTH = { left: 250, right: 660, bottom: 230, degree: 6 };

function polynomialFit(values, left, right, degree) {
  const size = degree + 1;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));
  const vector = Array(size).fill(0);

  for (let x = left; x <= right; x += 1) {
    if (values[x] < 0) continue;
    const u = (x - left) / (right - left);
    for (let i = 0; i < size; i += 1) {
      const ui = u ** i;
      vector[i] += values[x] * ui;
      for (let j = 0; j < size; j += 1) matrix[i][j] += ui * u ** j;
    }
  }

  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row;
    }
    [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
    [vector[column], vector[pivot]] = [vector[pivot], vector[column]];

    const divisor = matrix[column][column];
    if (divisor === 0) continue;
    for (let c = column; c < size; c += 1) matrix[column][c] /= divisor;
    vector[column] /= divisor;

    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = matrix[row][column];
      for (let c = column; c < size; c += 1) matrix[row][c] -= factor * matrix[column][c];
      vector[row] -= factor * vector[column];
    }
  }

  return (x) => {
    const u = (x - left) / (right - left);
    return vector.reduce((sum, coefficient, i) => sum + coefficient * u ** i, 0);
  };
}

function smoothTopOutline(rgba, width, height) {
  const { left, right, bottom, degree } = OUTLINE_SMOOTH;
  const lastX = Math.min(right, width - 1);
  const lastY = Math.min(bottom, height - 1);
  const alphaAt = (x, y) => rgba[(y * width + x) * 4 + 3];
  const outer = new Int16Array(width).fill(-1);
  const inner = new Int16Array(width).fill(-1);

  for (let x = left; x <= lastX; x += 1) {
    let first = -1;
    for (let y = 0; y < lastY; y += 1) {
      if (alphaAt(x, y) >= 128) {
        first = y;
        break;
      }
    }
    if (first < 0) continue;

    let last = first;
    for (let y = first + 1; y < lastY; y += 1) {
      if (alphaAt(x, y) >= 128) last = y;
      else if (y - last > 2) break;
    }
    outer[x] = first;
    inner[x] = last;
  }

  const topCurve = polynomialFit(outer, left, lastX, degree);
  const bottomCurve = polynomialFit(inner, left, lastX, degree);
  const smoothed = Buffer.from(rgba);
  for (let x = left; x <= lastX; x += 1) {
    if (outer[x] < 0) continue;
    const top = topCurve(x);
    const bottomEdge = bottomCurve(x);
    const from = Math.max(0, Math.floor(top) - 4);
    const to = Math.min(height - 1, Math.ceil(bottomEdge) + 4);

    for (let y = from; y <= to; y += 1) {
      const topAlpha = 255 * (0.5 + 0.5 * Math.tanh((y - top) / 0.9));
      const bottomAlpha = 255 * (0.5 + 0.5 * Math.tanh((bottomEdge - y) / 0.9));
      smoothed[(y * width + x) * 4 + 3] = Math.max(
        0,
        Math.min(255, Math.round(Math.min(topAlpha, bottomAlpha)))
      );
    }
  }

  return smoothed;
}

const { data, info } = await sharp(sourcePath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

if (info.channels !== 4) {
  throw new Error(`logo-splash.png debe tener 4 canales, recibidos ${info.channels}.`);
}

const { width, height } = info;
const body = Buffer.alloc(width * height * 4);
const coin = Buffer.alloc(width * height * 4);

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const pixel = y * width + x;
    const offset = pixel * 4;
    const distance = Math.hypot(x - COIN_CENTER.x, y - COIN_CENTER.y);
    const insideCoin = distance <= COIN_MASK_RADIUS;
    const coinEdge = Math.min(1, Math.max(0, COIN_EDGE_RADIUS - distance));

    body[offset] = 255;
    body[offset + 1] = 255;
    body[offset + 2] = 255;
    body[offset + 3] = insideCoin ? 0 : data[offset + 3];

    coin[offset] = 255;
    coin[offset + 1] = 255;
    coin[offset + 2] = 255;
    coin[offset + 3] = Math.round(data[offset + 3] * coinEdge);
  }
}

const patch = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<path d="${BACK_LINE_PATH}" fill="none" stroke="#FFFFFF" ` +
    `stroke-width="${BACK_LINE_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>`
);

const bodyBase = await sharp(body, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toBuffer();

const bodyPatched = await sharp(bodyBase)
  .composite([{ input: patch, left: 0, top: 0 }])
  .png({ compressionLevel: 9 })
  .toBuffer();

const bodyRgba = await sharp(bodyPatched)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

let minX = width;
let minY = height;
let maxX = -1;
let maxY = -1;

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    if (bodyRgba.data[(y * width + x) * 4 + 3] === 0) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
}

const bodyCrop = {
  left: minX - BODY_MARGIN,
  top: minY - BODY_MARGIN,
  width: maxX - minX + 1 + BODY_MARGIN * 2,
  height: maxY - minY + 1 + BODY_MARGIN * 2,
};

await mkdir(assetsDir, { recursive: true });

const bodyRaw = await sharp(bodyPatched)
  .extract(bodyCrop)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const smoothedBody = smoothTopOutline(bodyRaw.data, bodyRaw.info.width, bodyRaw.info.height);

await sharp(smoothedBody, {
  raw: { width: bodyRaw.info.width, height: bodyRaw.info.height, channels: 4 },
})
  .png({ compressionLevel: 9 })
  .toFile(bodyPath);

await sharp(coin, { raw: { width, height, channels: 4 } })
  .extract(COIN_CROP)
  .png({ compressionLevel: 9 })
  .toFile(coinPath);

const metadata = {
  source: { width, height },
  body: bodyCrop,
  coin: COIN_CROP,
  slot: SLOT,
};

await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

console.log(JSON.stringify({ body: bodyPath, coin: coinPath, metadata }, null, 2));
