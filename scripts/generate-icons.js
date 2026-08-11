/**
 * 从 SVG 生成各平台图标
 * 用法: node scripts/generate-icons.js
 */
const sharp = require('sharp');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SVG_PATH = path.resolve(__dirname, '../build/logo.svg');
const BUILD_DIR = path.resolve(__dirname, '../build');

async function main() {
  const svgBuf = fs.readFileSync(SVG_PATH);

  // 1. 生成 1024x1024 主 PNG
  await sharp(svgBuf, { density: 300 })
    .resize(1024, 1024)
    .png()
    .toFile(path.join(BUILD_DIR, 'icon.png'));
  console.log('✓ icon.png (1024x1024)');

  // 2. 生成 icon.icns (mac) — 需要 iconutil
  try {
    const iconsetDir = path.join(BUILD_DIR, 'icon.iconset');
    if (!fs.existsSync(iconsetDir)) fs.mkdirSync(iconsetDir, { recursive: true });

    const sizes = [16, 32, 64, 128, 256, 512, 1024];
    for (const size of sizes) {
      const buf = await sharp(svgBuf, { density: 300 }).resize(size, size).png().toBuffer();
      fs.writeFileSync(path.join(iconsetDir, `icon_${size}x${size}.png`), buf);
      if (size <= 512) {
        const buf2x = await sharp(svgBuf, { density: 300 }).resize(size * 2, size * 2).png().toBuffer();
        fs.writeFileSync(path.join(iconsetDir, `icon_${size}x${size}@2x.png`), buf2x);
      }
    }
    execSync(`iconutil -c icns -o "${path.join(BUILD_DIR, 'icon.icns')}" "${iconsetDir}"`);
    console.log('✓ icon.icns (mac)');
  } catch (e) {
    console.warn('⚠ icon.icns 生成失败（需要 macOS）:', e.message);
  }

  // 3. 生成 icon.ico (windows) — 用 PNG 256 作为 ico
  // sharp 可以输出 ico 格式（通过 ICO 编码）
  try {
    const buf256 = await sharp(svgBuf, { density: 300 }).resize(256, 256).png().toBuffer();
    // 构造简单 ICO 文件头 + PNG 数据
    const ico = createIcoFromPng(buf256);
    fs.writeFileSync(path.join(BUILD_DIR, 'icon.ico'), ico);
    console.log('✓ icon.ico (windows)');
  } catch (e) {
    console.warn('⚠ icon.ico 生成失败:', e.message);
  }

  console.log('\n图标生成完成！');
}

/** 将 PNG 封装为 ICO 格式 */
function createIcoFromPng(pngBuf) {
  const headerSize = 6;
  const dirEntrySize = 16;
  const offset = headerSize + dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);  // reserved
  header.writeUInt16LE(1, 2);  // type = ICO
  header.writeUInt16LE(1, 4);  // count = 1 image

  const dir = Buffer.alloc(dirEntrySize);
  dir.writeUInt8(0, 0);        // width (0 = 256)
  dir.writeUInt8(0, 1);        // height (0 = 256)
  dir.writeUInt8(0, 2);        // palette
  dir.writeUInt8(0, 3);        // reserved
  dir.writeUInt16LE(1, 4);     // color planes
  dir.writeUInt16LE(32, 6);    // bits per pixel
  dir.writeUInt32LE(pngBuf.length, 8);  // image size
  dir.writeUInt32LE(offset, 12);        // image offset

  return Buffer.concat([header, dir, pngBuf]);
}

main().catch(console.error);
