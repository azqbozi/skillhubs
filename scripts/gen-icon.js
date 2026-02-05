/**
 * 生成 Tauri 应用图标
 * 创建 PNG 和 ICO 图标
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const size = 1024;
const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#6366f1"/>
  <text x="50%" y="55%" font-size="${size/2}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">S</text>
</svg>
`;

const outDir = path.join(__dirname, '..', 'src-tauri', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const pngPath = path.join(outDir, 'icon.png');
const icoPath = path.join(outDir, 'icon.ico');

async function main() {
  await sharp(Buffer.from(svg)).png().toFile(pngPath);
  console.log('Created:', pngPath);

  // 生成各尺寸 PNG（tauri.conf.json 需要）
  await sharp(pngPath).resize(32, 32).toFile(path.join(outDir, '32x32.png'));
  await sharp(pngPath).resize(128, 128).toFile(path.join(outDir, '128x128.png'));
  await sharp(pngPath).resize(256, 256).toFile(path.join(outDir, '128x128@2x.png'));
  console.log('PNG icons created.');

  // 生成 ICO（Windows 必需）- 使用 CLI
  const { execSync } = require('child_process');
  execSync(`npx png-to-ico "${pngPath}" > "${icoPath}"`, { shell: true, stdio: 'inherit' });
  console.log('icon.ico created!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
