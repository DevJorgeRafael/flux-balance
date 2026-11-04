import sharp from 'sharp';

const W = 1024;
const H = 500;
const LOGO_SIZE = 340;

const src = 'assets/images/logos-app/glyph-white-2000.png';
const out = 'assets/images/logos-app/feature-graphic-1024x500.png';

const background = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2563eb"/>
      <stop offset="1" stop-color="#0b2a7a"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`);

const logo = await sharp(src)
  .resize(LOGO_SIZE, LOGO_SIZE, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp(background)
  .composite([
    {
      input: logo,
      left: Math.round((W - LOGO_SIZE) / 2),
      top: Math.round((H - LOGO_SIZE) / 2),
    },
  ])
  .png()
  .toFile(out);

console.log(`Listo: ${out}`);