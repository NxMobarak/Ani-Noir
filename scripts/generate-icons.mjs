import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

const svgIcon = readFileSync(resolve(publicDir, 'icon-512x512.svg'));
const svgMaskable = readFileSync(resolve(publicDir, 'icon-maskable-512x512.svg'));

async function generate() {
  // Regular icons
  await sharp(svgIcon).resize(512, 512).png().toFile(resolve(publicDir, 'icon-512x512.png'));
  await sharp(svgIcon).resize(192, 192).png().toFile(resolve(publicDir, 'icon-192x192.png'));
  await sharp(svgIcon).resize(384, 384).png().toFile(resolve(publicDir, 'icon-384x384.png'));
  await sharp(svgIcon).resize(256, 256).png().toFile(resolve(publicDir, 'icon-256x256.png'));
  await sharp(svgIcon).resize(128, 128).png().toFile(resolve(publicDir, 'icon-128x128.png'));
  
  // Maskable icons
  await sharp(svgMaskable).resize(512, 512).png().toFile(resolve(publicDir, 'icon-maskable-512x512.png'));
  await sharp(svgMaskable).resize(192, 192).png().toFile(resolve(publicDir, 'icon-maskable-192x192.png'));
  
  // Apple touch icon
  await sharp(svgIcon).resize(180, 180).png().toFile(resolve(publicDir, 'apple-touch-icon.png'));

  console.log('All icons generated successfully!');
}

generate().catch(console.error);
