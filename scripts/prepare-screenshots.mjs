import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

const inDir = 'screenshots/raw';
const outDir = 'screenshots/store';
const CROP_TOP = 60;   // altura de la barra de estado en la captura original (ajustar si sobra o falta)
const TARGET_W = 1080;
const PAD_COLOR = { r: 15, g: 23, b: 42, alpha: 1 }; // relleno de los bordes laterales

await mkdir(outDir, { recursive: true });

for (const file of await readdir(inDir)) {
  if (!/\.(png|jpe?g)$/i.test(file)) continue;

  const input = path.join(inDir, file);
  const meta = await sharp(input).metadata();
  const h = meta.height - CROP_TOP;
  let w = meta.width;

  let img = sharp(input).extract({ left: 0, top: CROP_TOP, width: w, height: h });

  if (h > 2 * w) {
    const newW = Math.ceil(h / 2);
    const padX = Math.floor((newW - w) / 2);
    img = img.extend({
      left: padX,
      right: newW - w - padX,
      top: 0,
      bottom: 0,
      background: PAD_COLOR,
    });
    w = newW;
  }

  const outName = file.replace(/\.(jpe?g|png)$/i, '.png');
  await img
    .resize({ width: TARGET_W })
    .png()
    .toFile(path.join(outDir, outName));

  console.log(`OK: ${file} ${meta.width}x${meta.height} -> ${TARGET_W}x${Math.round(h * TARGET_W / w)}`);
}