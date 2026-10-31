import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'assets', 'images', 'logos-app');
const sourcePath = join(assetsDir, 'flux-balance-logo-2000.png');
const qaDir = join(tmpdir(), 'flux-balance-icon-qa');

const output = {
  icon: join(assetsDir, 'icon-1024.png'),
  playStore: join(assetsDir, 'play-store-icon-512.png'),
  foreground: join(assetsDir, 'logo-foreground-1024.png'),
  monochrome: join(assetsDir, 'logo-monochrome-1024.png'),
  splash: join(assetsDir, 'logo-splash.png'),
  glyph: join(assetsDir, 'glyph-white-2000.png'),
  preview: join(assetsDir, 'generated-assets-preview.png'),
  qaMagenta: join(qaDir, 'glyph-qa-magenta.png'),
  qaBlack: join(qaDir, 'glyph-qa-black.png'),
};

const EDGE_SAMPLES = 8;
const MIN_ALPHA = 2;
const FOREGROUND_SAFE_DIAMETER = 640;
const FOREGROUND_SAFE_MARGIN = 2;
const SPLASH_MARGIN_RATIO = 0.1;
const SPLASH_MAX_SIZE = 1024;
const TILE_SIZE = 280;
const TILE_GAP = 20;
const TILE_MARGIN = 24;
const LABEL_HEIGHT = 34;

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function toHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function alphaStats(alpha, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let pixels = 0;
  let sum = 0;
  let max = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const value = alpha[y * width + x];
      if (value > 0) {
        pixels += 1;
        sum += value;
        if (value > max) max = value;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    pixels,
    coverage: pixels / (width * height),
    meanOnGlyph: pixels > 0 ? sum / pixels : 0,
    max,
  };
}

const { data, info } = await sharp(sourcePath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

if (info.channels !== 4) {
  throw new Error(`La imagen fuente debe tener 4 canales, recibidos ${info.channels}.`);
}

if (info.width !== info.height) {
  throw new Error(`La imagen fuente debe ser cuadrada, recibida ${info.width}x${info.height}.`);
}

const { width, height } = info;
const backgroundRows = [];

for (let y = 0; y < height; y += 1) {
  const red = [];
  const green = [];
  const blue = [];

  for (let offset = 0; offset < EDGE_SAMPLES; offset += 1) {
    const left = (y * width + offset) * 4;
    const right = (y * width + width - EDGE_SAMPLES + offset) * 4;

    red.push(data[left], data[right]);
    green.push(data[left + 1], data[right + 1]);
    blue.push(data[left + 2], data[right + 2]);
  }

  backgroundRows.push({
    r: median(red),
    g: median(green),
    b: median(blue),
  });
}

const alpha = new Uint8Array(width * height);
let discardedLowAlphaPixels = 0;

for (let y = 0; y < height; y += 1) {
  const background = backgroundRows[y];
  const denominator = 255 - background.r;

  for (let x = 0; x < width; x += 1) {
    const offset = (y * width + x) * 4;
    let value = denominator > 0 ? (data[offset] - background.r) / denominator : 0;

    if (value < 0) value = 0;
    if (value > 1) value = 1;

    let byte = Math.round(value * 255);
    if (byte > 0 && byte < MIN_ALPHA) {
      discardedLowAlphaPixels += 1;
      byte = 0;
    }
    alpha[y * width + x] = byte;
  }
}

const bbox = alphaStats(alpha, width, height);
const centerX = (bbox.minX + bbox.maxX) / 2;
const centerY = (bbox.minY + bbox.maxY) / 2;
let maxRadius = 0;

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    if (alpha[y * width + x] === 0) continue;
    const radius = Math.hypot(x - centerX, y - centerY);
    if (radius > maxRadius) maxRadius = radius;
  }
}

const glyph = Buffer.alloc(width * height * 4);

for (let pixel = 0; pixel < width * height; pixel += 1) {
  const offset = pixel * 4;
  glyph[offset] = 255;
  glyph[offset + 1] = 255;
  glyph[offset + 2] = 255;
  glyph[offset + 3] = alpha[pixel];
}

await mkdir(assetsDir, { recursive: true });
await mkdir(qaDir, { recursive: true });

await sharp(glyph, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(output.glyph);

const croppedGlyph = await sharp(glyph, { raw: { width, height, channels: 4 } })
  .extract({
    left: bbox.minX,
    top: bbox.minY,
    width: bbox.width,
    height: bbox.height,
  })
  .png({ compressionLevel: 9 })
  .toBuffer();

const foregroundContentSize = FOREGROUND_SAFE_DIAMETER - FOREGROUND_SAFE_MARGIN * 2;
const foregroundScale = Math.min(
  foregroundContentSize / bbox.width,
  foregroundContentSize / bbox.height,
  (FOREGROUND_SAFE_DIAMETER / 2 - FOREGROUND_SAFE_MARGIN) / maxRadius
);

const foregroundWidth = Math.max(1, Math.round(bbox.width * foregroundScale));
const foregroundHeight = Math.max(1, Math.round(bbox.height * foregroundScale));

const foregroundGlyph = await sharp(croppedGlyph)
  .resize({
    width: foregroundWidth,
    height: foregroundHeight,
    fit: 'fill',
    kernel: 'lanczos3',
  })
  .png({ compressionLevel: 9 })
  .toBuffer();

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const foreground = await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: transparent },
})
  .composite([
    {
      input: foregroundGlyph,
      left: Math.round((1024 - foregroundWidth) / 2),
      top: Math.round((1024 - foregroundHeight) / 2),
    },
  ])
  .png({ compressionLevel: 9 })
  .toBuffer();

await writeFile(output.foreground, foreground);
await writeFile(output.monochrome, foreground);

await sharp(sourcePath)
  .resize(1024, 1024, { fit: 'cover', kernel: 'lanczos3' })
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile(output.icon);

await sharp(sourcePath)
  .resize(512, 512, { fit: 'cover', kernel: 'lanczos3' })
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile(output.playStore);

const splashPadding = Math.round(Math.max(bbox.width, bbox.height) * SPLASH_MARGIN_RATIO);
const splashCanvasWidth = bbox.width + splashPadding * 2;
const splashCanvasHeight = bbox.height + splashPadding * 2;

const splashCanvas = await sharp({
  create: {
    width: splashCanvasWidth,
    height: splashCanvasHeight,
    channels: 4,
    background: transparent,
  },
})
  .composite([{ input: croppedGlyph, left: splashPadding, top: splashPadding }])
  .png({ compressionLevel: 9 })
  .toBuffer();

await sharp(splashCanvas)
  .resize({
    width: SPLASH_MAX_SIZE,
    height: SPLASH_MAX_SIZE,
    fit: 'inside',
    kernel: 'lanczos3',
    withoutEnlargement: true,
  })
  .png({ compressionLevel: 9 })
  .toFile(output.splash);

const magenta = await sharp({
  create: { width, height, channels: 3, background: '#FF00FF' },
})
  .composite([{ input: output.glyph }])
  .png({ compressionLevel: 9 })
  .toBuffer();

const black = await sharp({
  create: { width, height, channels: 3, background: '#000000' },
})
  .composite([{ input: output.glyph }])
  .png({ compressionLevel: 9 })
  .toBuffer();

await sharp(magenta)
  .resize({ width: 1000, height: 1000, fit: 'inside' })
  .png({ compressionLevel: 9 })
  .toFile(output.qaMagenta);

await sharp(black)
  .resize({ width: 1000, height: 1000, fit: 'inside' })
  .png({ compressionLevel: 9 })
  .toFile(output.qaBlack);

const checkerSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_SIZE}" height="${TILE_SIZE}">` +
    `<defs><pattern id="checker" width="20" height="20" patternUnits="userSpaceOnUse">` +
    `<rect width="20" height="20" fill="#1E293B"/>` +
    `<rect width="10" height="10" fill="#334155"/>` +
    `<rect x="10" y="10" width="10" height="10" fill="#334155"/>` +
    `</pattern></defs><rect width="100%" height="100%" fill="url(#checker)"/></svg>`
);

const checkerTile = await sharp(checkerSvg).png().toBuffer();

const previewWidth = TILE_MARGIN * 2 + TILE_SIZE * 5 + TILE_GAP * 4;
const previewHeight = TILE_MARGIN * 2 + TILE_SIZE + LABEL_HEIGHT;

const previewItems = [
  { name: 'icon-1024.png', path: output.icon, fit: 'cover', background: null },
  {
    name: 'play-store-512.png',
    path: output.playStore,
    fit: 'cover',
    background: null,
  },
  {
    name: 'logo-foreground-1024.png',
    path: output.foreground,
    fit: 'contain',
    background: checkerTile,
  },
  {
    name: 'logo-monochrome-1024.png',
    path: output.monochrome,
    fit: 'contain',
    background: checkerTile,
  },
  { name: 'logo-splash.png', path: output.splash, fit: 'contain', background: checkerTile },
];

const previewTiles = [];

for (let index = 0; index < previewItems.length; index += 1) {
  const item = previewItems[index];
  const left = TILE_MARGIN + index * (TILE_SIZE + TILE_GAP);

  const resized = await sharp(item.path)
    .resize({
      width: TILE_SIZE,
      height: TILE_SIZE,
      fit: item.fit,
      position: 'centre',
      background: transparent,
      kernel: 'lanczos3',
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  if (item.background) {
    previewTiles.push({
      input: await sharp(item.background)
        .composite([{ input: resized, left: 0, top: 0 }])
        .png({ compressionLevel: 9 })
        .toBuffer(),
      left,
      top: TILE_MARGIN,
    });
  } else {
    previewTiles.push({ input: resized, left, top: TILE_MARGIN });
  }
}

const labels = previewItems
  .map((item, index) => {
    const x = TILE_MARGIN + index * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2;
    const y = TILE_MARGIN + TILE_SIZE + 23;
    return `<text x="${x}" y="${y}" fill="#CBD5E1" font-family="Arial, sans-serif" font-size="14" font-weight="600" text-anchor="middle">${item.name}</text>`;
  })
  .join('');

const labelsSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${previewWidth}" height="${previewHeight}">${labels}</svg>`
);

await sharp({
  create: {
    width: previewWidth,
    height: previewHeight,
    channels: 4,
    background: '#0B1220',
  },
})
  .composite([...previewTiles, { input: labelsSvg, left: 0, top: 0 }])
  .png({ compressionLevel: 9 })
  .toFile(output.preview);

const generated = {
  source: {
    width,
    height,
    channels: info.channels,
    gradient: {
      top: toHex(backgroundRows[0]),
      middle: toHex(backgroundRows[Math.floor(height / 2)]),
      bottom: toHex(backgroundRows[height - 1]),
    },
  },
  glyph: {
    threshold: MIN_ALPHA,
    discardedLowAlphaPixels,
    pixels: bbox.pixels,
    coverage: bbox.coverage,
    meanOnGlyph: bbox.meanOnGlyph,
    maxAlpha: bbox.max,
    bbox: {
      left: bbox.minX,
      top: bbox.minY,
      right: bbox.maxX,
      bottom: bbox.maxY,
      width: bbox.width,
      height: bbox.height,
    },
    maxRadiusFromBboxCenter: maxRadius,
  },
  foreground: {
    scale: foregroundScale,
    contentWidth: foregroundWidth,
    contentHeight: foregroundHeight,
    safeDiameter: FOREGROUND_SAFE_DIAMETER,
    safeMargin: FOREGROUND_SAFE_MARGIN,
  },
  splash: {
    padding: splashPadding,
    canvasWidth: splashCanvasWidth,
    canvasHeight: splashCanvasHeight,
    maxSize: SPLASH_MAX_SIZE,
  },
  output,
};

console.log(JSON.stringify(generated, null, 2));
