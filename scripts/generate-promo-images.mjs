import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'assets/images/screenshots/phone');
const EXTENDED = path.join(ROOT, 'assets/images/screenshots/phone-status');
const LOGOS = path.join(ROOT, 'assets/images/logos-app');
const OUT = path.join(ROOT, 'assets/images/posts');

const BAND = 120;
const SEED = 12;
const W = 1200;
const H = 1600;
const FONT = "Arial, 'Segoe UI', Helvetica, sans-serif";

const C = {
  blue: '#2563eb',
  blueLight: '#60a5fa',
  blueSoft: '#eaf1ff',
  navy: '#0b1f4d',
  ink: '#1c1917',
  muted: '#57534e',
  stone: '#fafaf9',
  night: '#0A0E1A',
  nightText: '#8F9BB8',
};

await fs.mkdir(OUT, { recursive: true });

const cache = new Map();
async function b64(file) {
  if (!cache.has(file)) cache.set(file, (await fs.readFile(file)).toString('base64'));
  return cache.get(file);
}

async function extendScreenshots() {
  await fs.mkdir(EXTENDED, { recursive: true });
  const files = (await fs.readdir(SHOTS)).filter((f) => f.endsWith('.png'));
  for (const file of files) {
    const source = path.join(SHOTS, file);
    const { width, height } = await sharp(source).metadata();
    const band = await sharp(source)
      .extract({ left: 0, top: 0, width, height: SEED })
      .resize(width, BAND, { fit: 'fill', kernel: 'linear' })
      .png()
      .toBuffer();
    const body = await sharp(source)
      .extract({ left: 0, top: SEED, width, height: height - SEED })
      .png()
      .toBuffer();
    await sharp({
      create: { width, height: height + BAND, channels: 3, background: '#ffffff' },
    })
      .composite([{ input: band, left: 0, top: 0 }, { input: body, left: 0, top: BAND }])
      .png()
      .toFile(path.join(EXTENDED, file));
  }
  return files;
}

const svgCanvas = (w, h, body, defs = '') =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}${body}</svg>`);
const svgDoc = (body, defs = '') => svgCanvas(W, H, body, defs);

function text(x, y, value, opts = {}) {
  const {
    size = 24,
    weight = 400,
    fill = C.ink,
    anchor = 'start',
    spacing = 0,
    opacity = 1,
  } = opts;
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${spacing}" opacity="${opacity}">${value}</text>`;
}

function rect(x, y, w, h, r, fill, opts = {}) {
  const { opacity = 1, stroke = 'none', strokeWidth = 0 } = opts;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

function line(x1, y1, x2, y2, stroke, width = 1, opacity = 1) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" stroke-opacity="${opacity}"/>`;
}

const phoneShadow = (id, blur, dy, color, opacity) =>
  `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
     <feDropShadow dx="0" dy="${dy}" stdDeviation="${blur}" flood-color="${color}" flood-opacity="${opacity}"/>
   </filter>`;

const SHADOW_LIGHT = phoneShadow('s', 18, 16, '#12204a', 0.22);
const SHADOW_DARK = phoneShadow('s', 22, 18, '#000000', 0.55);
const SHADOW_SOFT = phoneShadow('s', 11, 9, '#12204a', 0.18);

async function topColor(file) {
  const source = path.join(SHOTS, file);
  const { width } = await sharp(source).metadata();
  const { data, info } = await sharp(source)
    .extract({ left: Math.round(width * 0.28), top: 0, width: Math.round(width * 0.44), height: 2 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const sum = [0, 0, 0];
  for (let i = 0; i < data.length; i += info.channels) {
    for (let c = 0; c < 3; c++) sum[c] += data[i + c];
  }
  const count = data.length / info.channels;
  return sum.map((value) => Math.round(value / count));
}

function readableOn([r, g, b]) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45 ? '#ffffff' : '#1c1917';
}

async function phone(file, screenW, { dark = false, shadowDef = SHADOW_LIGHT, statusBar = 'ios', sourceFile } = {}) {
  const android = statusBar === 'android';
  const bare = statusBar === 'none';
  const source = sourceFile ?? path.join(android ? EXTENDED : SHOTS, file);
  const { width: srcW, height: srcH } = await sharp(source).metadata();
  const screenH = Math.round((screenW * srcH) / srcW);
  const bezel = Math.max(5, Math.round(screenW * 0.028));
  const pad = Math.round(screenW * 0.12);
  const w = screenW + bezel * 2;
  const h = screenH + bezel * 2;
  const radius = Math.round(screenW * 0.12);
  const outerRadius = radius + bezel;
  const image = await b64(source);
  const islandW = Math.round(screenW * 0.26);
  const islandH = Math.round(screenW * 0.062);
  const top = android ? await topColor(file) : null;
  const barH = android ? Math.round((screenW * BAND) / srcW) : 0;
  const status = android ? readableOn(top) : dark ? '#ffffff' : '#1c1917';

  let statusBarSvg = bare ? '' : `
    <text x="${bezel + screenW * 0.085}" y="${bezel + screenW * 0.075}" font-family="${FONT}" font-size="${Math.round(screenW * 0.052)}" font-weight="700" fill="${status}" opacity="0.92">9:41</text>
    <rect x="${w / 2 - islandW / 2}" y="${bezel + screenW * 0.018}" width="${islandW}" height="${islandH}" rx="${islandH / 2}" fill="#050914"/>
    <circle cx="${w / 2 + islandW * 0.32}" cy="${bezel + screenW * 0.018 + islandH / 2}" r="${screenW * 0.008}" fill="#1e2a44"/>
    <g fill="${status}" opacity="0.9">
      <rect x="${bezel + screenW * 0.69}" y="${bezel + screenW * 0.045}" width="${screenW * 0.035}" height="${screenW * 0.022}" rx="2"/>
      <rect x="${bezel + screenW * 0.75}" y="${bezel + screenW * 0.045}" width="${screenW * 0.035}" height="${screenW * 0.022}" rx="2"/>
      <rect x="${bezel + screenW * 0.81}" y="${bezel + screenW * 0.045}" width="${screenW * 0.035}" height="${screenW * 0.022}" rx="2"/>
      <rect x="${bezel + screenW * 0.87}" y="${bezel + screenW * 0.042}" width="${screenW * 0.045}" height="${screenW * 0.03}" rx="4" fill-opacity="0.5"/>
    </g>`;

  if (android) {
    const signalX = bezel + screenW * 0.73;
    const signalBottom = bezel + barH * 0.68;
    const signalW = Math.max(1.5, screenW * 0.012);
    const batteryX = bezel + screenW * 0.88;
    statusBarSvg = `
      <text x="${bezel + screenW * 0.055}" y="${bezel + barH * 0.72}" font-family="${FONT}" font-size="${Math.round(barH * 0.6)}" font-weight="700" fill="${status}">9:41</text>
      <circle cx="${w / 2}" cy="${bezel + barH * 0.5}" r="${barH * 0.22}" fill="#050914" stroke="#334155" stroke-width="0.6"/>
      <g fill="${status}">
        ${[0, 1, 2].map((i) => {
          const height = barH * (0.18 + i * 0.12);
          return `<rect x="${signalX + i * signalW * 1.7}" y="${signalBottom - height}" width="${signalW}" height="${height}" rx="0.5"/>`;
        }).join('')}
        <rect x="${batteryX}" y="${bezel + barH * 0.28}" width="${screenW * 0.06}" height="${barH * 0.4}" rx="${barH * 0.12}" fill="none" stroke="${status}" stroke-width="0.8" opacity="0.85"/>
        <rect x="${batteryX + screenW * 0.008}" y="${bezel + barH * 0.35}" width="${screenW * 0.03}" height="${barH * 0.26}" rx="${barH * 0.07}" opacity="0.9"/>
      </g>`;
  }

  return sharp(svgCanvas(
    w + pad * 2,
    h + pad * 2,
    `<g transform="translate(${pad} ${pad})" filter="url(#s)">
       <rect width="${w}" height="${h}" rx="${outerRadius}" fill="#0b1220"/>
       <rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="${outerRadius - 1.5}" fill="none" stroke="#46506b" stroke-width="1.5" stroke-opacity="0.9"/>
       <clipPath id="screen"><rect x="${bezel}" y="${bezel}" width="${screenW}" height="${screenH}" rx="${radius}"/></clipPath>
       <g clip-path="url(#screen)">
          <image href="data:image/png;base64,${image}" x="${bezel}" y="${bezel}" width="${screenW}" height="${screenH}"/>
          ${statusBarSvg}
       </g>
     </g>`,
    `<defs>${shadowDef}</defs>`
  ))
    .png()
    .toBuffer();
}

async function place(img, cx, cy, angle = 0) {
  const rotated = angle
    ? await sharp(img).rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
    : img;
  const { width, height } = await sharp(rotated).metadata();
  return {
    href: `data:image/png;base64,${rotated.toString('base64')}`,
    left: Math.round(cx - width / 2),
    top: Math.round(cy - height / 2),
  };
}

const imageTag = ({ href, left, top }) => `<image href="${href}" x="${left}" y="${top}"/>`;

const shadowLight = `<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
  <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#12204a" flood-opacity="0.22"/>
</filter>`;
const shadowDark = `<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
  <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000000" flood-opacity="0.55"/>
</filter>`;
const shadowSoft = `<filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
  <feDropShadow dx="0" dy="9" stdDeviation="11" flood-color="#12204a" flood-opacity="0.18"/>
</filter>`;

function wordmark(x, y, size, colorA, colorB) {
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="700" letter-spacing="-2" fill="${colorA}"><tspan>Flux</tspan><tspan fill="${colorB}"> Balance</tspan></text>`;
}

async function renderClaro({
  output,
  statusBar = 'ios',
  eyebrow = 'PANTALLAS REALES DE LA APP',
  captionFirst = 736,
  captionSecond = 1160,
  phoneFirst = 752,
  phoneSecond = 1180,
  heroFrontFile = 'home.png',
  heroFrontSource,
  heroFrontStatus,
  iconFile = 'play-store-icon-512.png',
}) {
  const icon = await b64(path.join(LOGOS, iconFile));
  const heroBack = await place(await phone('accounts.png', 230, { statusBar }), 790, 280, -9);
  const heroFront = await place(await phone(heroFrontFile, 260, {
    statusBar: heroFrontStatus ?? statusBar,
    sourceFile: heroFrontSource,
  }), 958, 326, 7);

  const grid = [
    ['home.png', 'INICIO'],
    ['accounts.png', 'CUENTAS'],
    ['register-expense.png', 'REGISTRAR GASTO'],
    ['stats.png', 'ESTADÍSTICAS'],
    ['stats-trend.png', 'TENDENCIA'],
    ['register-income.png', 'REGISTRAR INGRESO'],
    ['home-dark.png', 'MODO OSCURO'],
    ['stats-dark.png', 'GASTOS POR CATEGORÍA'],
  ];
  const cols = [157, 389, 621, 853];
  let body = `
    <rect width="${W}" height="${H}" fill="${C.stone}"/>
    <circle cx="930" cy="248" r="360" fill="${C.blueSoft}" opacity="0.9"/>
    <circle cx="1090" cy="520" r="150" fill="#dbe8ff" opacity="0.65"/>
    <circle cx="930" cy="248" r="420" fill="none" stroke="#c9d9ff" stroke-width="2" opacity="0.6"/>
    ${line(80, 650, 1120, 650, '#d6d3d1', 2)}
    <image href="data:image/png;base64,${icon}" x="86" y="92" width="140" height="140" filter="url(#shadow)"/>
    ${wordmark(262, 160, 56, C.ink, C.blue)}
    ${text(264, 212, 'Tus finanzas, en equilibrio.', { size: 28, fill: C.muted })}
    ${rect(264, 238, 56, 4, 2, C.blue)}
    ${text(264, 296, 'Anota ingresos y gastos al instante.', { size: 23, fill: C.muted })}
    ${text(264, 330, 'Mira tus saldos y entiende', { size: 23, fill: C.muted })}
    ${text(264, 364, 'en qué se va tu dinero.', { size: 23, fill: C.muted })}
  `;
  const features = ['Cuentas y saldos consolidados', 'Estadísticas por categoría', 'Modo claro y oscuro'];
  features.forEach((f, i) => {
    const y = 426 + i * 38;
    body += `<circle cx="270" cy="${y - 7}" r="5" fill="${C.blue}"/>${text(290, y, f, { size: 21, weight: 600, fill: C.ink })}`;
  });
  body += imageTag(heroBack) + imageTag(heroFront);
  body += text(80, 694, eyebrow, { size: 19, weight: 700, fill: C.blue, spacing: 3 });
  body += text(1120, 694, '01 — 08', { size: 19, weight: 700, fill: C.blue, spacing: 2, anchor: 'end' });
  for (const [i, [file, label]] of grid.entries()) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = cols[col];
    const captionY = row === 0 ? captionFirst : captionSecond;
    const top = row === 0 ? phoneFirst : phoneSecond;
    body += text(x, captionY, `${String(i + 1).padStart(2, '0')} · ${label}`, { size: 17, weight: 700, fill: C.ink });
    body += `<image href="data:image/png;base64,${(await phone(file, 178, { dark: file.includes('dark'), shadowDef: SHADOW_SOFT, statusBar })).toString('base64')}" x="${x}" y="${top}"/>`;
  }

  await sharp(svgDoc(body, shadowLight + shadowSoft)).png().toFile(path.join(OUT, output));
}

async function optionTwo() {
  const icon = await b64(path.join(LOGOS, 'play-store-icon-512.png'));
  const left = await place(await phone('stats-dark.png', 220, { dark: true, shadowDef: SHADOW_DARK }), 248, 555, -12);
  const center = await place(await phone('home-dark.png', 300, { dark: true, shadowDef: SHADOW_DARK }), 600, 520, 0);
  const right = await place(await phone('accounts.png', 220, { shadowDef: SHADOW_DARK }), 952, 555, 12);

  const row = [
    ['home.png', 'CLARO', false],
    ['home-dark.png', 'OSCURO', true],
    ['stats.png', 'CLARO', false],
    ['stats-dark.png', 'OSCURO', true],
  ];
  const cols = [72, 344, 616, 888];
  let body = `
    <defs>
      <linearGradient id="night" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#0A0E1A"/>
        <stop offset="0.55" stop-color="#0e1730"/>
        <stop offset="1" stop-color="#16234d"/>
      </linearGradient>
      <radialGradient id="glow">
        <stop offset="0" stop-color="#2563eb" stop-opacity="0.38"/>
        <stop offset="1" stop-color="#2563eb" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#night)"/>
    <ellipse cx="600" cy="430" rx="520" ry="480" fill="url(#glow)"/>
    <circle cx="1070" cy="120" r="190" fill="#2563eb" opacity="0.10"/>
    ${Array.from({ length: 9 }, (_, i) => line(80 + i * 130, 0, 80 + i * 130, H, '#ffffff', 1, 0.035)).join('')}
    ${Array.from({ length: 12 }, (_, i) => line(0, 60 + i * 140, W, 60 + i * 140, '#ffffff', 1, 0.03)).join('')}
    <image href="data:image/png;base64,${icon}" x="86" y="92" width="140" height="140" filter="url(#shadow)"/>
    ${wordmark(262, 160, 64, '#ffffff', C.blueLight)}
    ${text(264, 200, 'Tus finanzas, en equilibrio.', { size: 28, fill: C.nightText })}
    ${rect(264, 228, 56, 4, 2, C.blueLight)}
    ${imageTag(left)}${imageTag(center)}${imageTag(right)}
    ${text(80, 858, 'ELIGE CÓMO VERLO', { size: 19, weight: 700, fill: C.blueLight, spacing: 3 })}
    ${text(80, 920, 'El mismo control, tu estilo.', { size: 52, weight: 700, fill: '#ffffff', spacing: -1 })}
    ${text(80, 964, 'Cuentas, movimientos y estadísticas en la palma de tu mano.', { size: 25, fill: C.nightText })}
  `;
  for (const [i, [file, label, dark]] of row.entries()) {
    const x = cols[i];
    body += `<image href="data:image/png;base64,${(await phone(file, 240, { dark, shadowDef: dark ? SHADOW_DARK : SHADOW_SOFT })).toString('base64')}" x="${x}" y="980"/>`;
    body += text(x + 120, 1520, label, { size: 19, weight: 700, fill: dark ? C.blueLight : '#9aa6bf', anchor: 'middle', spacing: 2 });
  }
  body += text(600, 1570, 'FLUX BALANCE · TUS FINANZAS, EN EQUILIBRIO', {
    size: 16, fill: '#66738f', anchor: 'middle', spacing: 3,
  });

  await sharp(svgDoc(body, shadowDark + shadowSoft)).png().toFile(path.join(OUT, 'flux-balance-promo-02-oscuro.png'));
}

async function optionThree() {
  const icon = await b64(path.join(LOGOS, 'play-store-icon-512.png'));
  const grid = [
    ['home.png', 'INICIO', false],
    ['stats.png', 'ESTADÍSTICAS', false],
    ['home-dark.png', 'MODO OSCURO', true],
    ['register-expense.png', 'REGISTRAR GASTO', false],
  ];
  const cols = [500, 850];
  const rows = [140, 760];
  let body = `
    <defs>
      <linearGradient id="side" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="#1d4ed8"/>
        <stop offset="0.55" stop-color="#1942ad"/>
        <stop offset="1" stop-color="#0b2a7a"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="${C.stone}"/>
    <rect width="420" height="${H}" fill="url(#side)"/>
    <circle cx="1090" cy="1320" r="300" fill="${C.blueSoft}" opacity="0.75"/>
    ${Array.from({ length: 6 }, (_, i) => line(500 + i * 130, 0, 500 + i * 130, H, '#cbd5e1', 1, 0.14)).join('')}
    ${rect(420, 0, 1.5, H, 0, '#ffffff', { opacity: 0.22 })}
    <image href="data:image/png;base64,${icon}" x="70" y="92" width="140" height="140" filter="url(#shadow)"/>
    <text x="70" y="320" font-family="${FONT}" font-size="68" font-weight="700" letter-spacing="-2" fill="#ffffff"><tspan x="70" dy="0">Flux</tspan><tspan x="70" dy="70" fill="#93c5fd">Balance</tspan></text>
    <text x="70" y="440" font-family="${FONT}" font-size="25" fill="#dbeafe"><tspan x="70" dy="0">Tus finanzas,</tspan><tspan x="70" dy="34" >en equilibrio.</tspan></text>
    ${line(70, 500, 350, 500, '#ffffff', 2, 0.3)}
  `;
  const features = [
    ['01', 'Registra', 'Ingresos y gastos en segundos.'],
    ['02', 'Analiza', 'Gráficos que explican tus hábitos.'],
    ['03', 'Decide', 'Saldos claros, siempre a mano.'],
  ];
  features.forEach(([n, title, desc], i) => {
    const y = 590 + i * 190;
    body += text(70, y, n, { size: 22, weight: 700, fill: '#93c5fd' });
    body += text(120, y, title, { size: 36, weight: 700, fill: '#ffffff' });
    body += text(120, y + 34, desc, { size: 19, fill: '#dbeafe' });
  });
  body += rect(70, 1360, 280, 58, 29, '#ffffff', { opacity: 0.12, stroke: '#ffffff', strokeWidth: 1 });
  body += text(210, 1397, 'SIN ANUNCIOS · OFFLINE', { size: 17, weight: 700, fill: '#ffffff', anchor: 'middle', spacing: 1 });
  body += text(70, 1470, 'Hecho para tu día a día.', { size: 20, fill: '#c7d7ff' });

  for (const [i, [file, label, dark]] of grid.entries()) {
    const x = cols[i % 2];
    const y = rows[Math.floor(i / 2)];
    body += text(x, y - 22, label, { size: 18, weight: 700, fill: C.blue, spacing: 2 });
    body += `<image href="data:image/png;base64,${(await phone(file, 260, { dark, shadowDef: SHADOW_SOFT })).toString('base64')}" x="${x}" y="${y}"/>`;
  }
  body += text(500, 1400, 'Tu dinero, bajo control.', { size: 46, weight: 700, fill: C.navy, spacing: -1 });
  body += text(500, 1450, 'Flux Balance · Tu ciudad financiera, en un solo lugar.', { size: 21, fill: C.muted });

  await sharp(svgDoc(body, shadowLight + shadowSoft)).png().toFile(path.join(OUT, 'flux-balance-promo-03-editorial.png'));
}

async function generateRoundedIcon() {
  const size = 512;
  const source = path.join(LOGOS, 'play-store-icon-512.png');
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#ffffff"/>
  </svg>`);
  const output = path.join(LOGOS, 'play-store-icon-rounded-512.png');
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: source },
      { input: mask, blend: 'dest-in' },
    ])
    .png()
    .toFile(output);
  return output;
}

async function generateSplashAsset() {
  const background = await sharp(path.join(LOGOS, 'logo-background-1024.png'))
    .resize(1080, 2080, { fit: 'fill' })
    .png()
    .toBuffer();
  const glyph = await sharp(path.join(LOGOS, 'logo-splash.png'))
    .resize(620, null, { fit: 'inside' })
    .png()
    .toBuffer();
  const output = path.join(LOGOS, 'splash-gradient-1080x2080.png');
  await sharp(background).composite([{ input: glyph, gravity: 'center' }]).png().toFile(output);
  return output;
}

await generateRoundedIcon();
const splashAsset = await generateSplashAsset();
await extendScreenshots();
await renderClaro({ output: 'flux-balance-promo-01-claro.png' });
await renderClaro({
  output: 'flux-balance-promo-04-claro.png',
  statusBar: 'android',
  eyebrow: 'PANTALLAS DE LA APP',
  captionFirst: 759,
  captionSecond: 1195,
  phoneFirst: 750,
  phoneSecond: 1188,
});
await optionTwo();
await optionThree();
await renderClaro({
  output: 'flux-balance-promo-05-splash.png',
  statusBar: 'android',
  eyebrow: 'PANTALLAS DE LA APP',
  captionFirst: 759,
  captionSecond: 1195,
  phoneFirst: 750,
  phoneSecond: 1188,
  heroFrontFile: 'splash.png',
  heroFrontSource: splashAsset,
  heroFrontStatus: 'none',
  iconFile: 'play-store-icon-rounded-512.png',
});
console.log('Generadas 5 imágenes en', OUT);
