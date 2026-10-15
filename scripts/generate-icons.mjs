/**
 * 生成 Android 应用图标与启动图（依赖 sharp：npm i -D sharp）
 * 运行：node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

const GREEN = '#2f6b52';

/** 图标主体（书 + 完成标记），坐标系 512x512，与 public/icons/icon.svg 一致 */
const art = `
  <path d="M148 128c0-8.8 7.2-16 16-16h120c8.8 0 16 7.2 16 16v256c0 8.8-7.2 16-16 16H164c-8.8 0-16-7.2-16-16V128z" fill="#faf7f2"/>
  <path d="M216 112h120c8.8 0 16 7.2 16 16v256c0 8.8-7.2 16-16 16H216V112z" fill="#f1eadd"/>
  <rect x="248" y="176" width="72" height="10" rx="5" fill="#2f6b52"/>
  <rect x="248" y="216" width="72" height="10" rx="5" fill="#b8a98e"/>
  <rect x="248" y="256" width="72" height="10" rx="5" fill="#b8a98e"/>
  <rect x="248" y="296" width="48" height="10" rx="5" fill="#b8a98e"/>
  <circle cx="384" cy="384" r="72" fill="#c96f4a"/>
  <path d="M356 384l20 20 40-44" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
`;

/** 自适应图标前景：透明底，内容放在 108 画布中央 72 安全区 */
const foregroundSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 108 108">
  <g transform="translate(18 18) scale(${72 / 512})">${art}</g>
</svg>`;

/** 传统图标：圆角方形 / 圆形背景 + 主体 */
const legacySvg = (size, round) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  ${round ? '<circle cx="256" cy="256" r="256" fill="' + GREEN + '"/>' : '<rect width="512" height="512" rx="112" fill="' + GREEN + '"/>'}
  ${art}
</svg>`;

/** 启动图：品牌绿底 + 居中主体 */
const splashSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${GREEN}"/>
  <g transform="translate(96 96) scale(${320 / 512})">${art}</g>
</svg>`;

const DENSITIES = {
  mdpi: 1,
  hdpi: 1.5,
  xhdpi: 2,
  xxhdpi: 3,
  xxxhdpi: 4,
};

async function render(svg, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log('generated', path.relative(ROOT, outPath));
}

for (const [dpi, scale] of Object.entries(DENSITIES)) {
  const fg = Math.round(108 * scale);
  const legacy = Math.round(48 * scale);
  await render(foregroundSvg(fg), path.join(RES, `mipmap-${dpi}`, 'ic_launcher_foreground.png'));
  await render(legacySvg(legacy, false), path.join(RES, `mipmap-${dpi}`, 'ic_launcher.png'));
  await render(legacySvg(legacy, true), path.join(RES, `mipmap-${dpi}`, 'ic_launcher_round.png'));
}

await render(splashSvg(1024), path.join(RES, 'drawable', 'splash.png'));
console.log('done');
