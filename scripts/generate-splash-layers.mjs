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

await sharp(bodyPatched)
  .extract(bodyCrop)
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
