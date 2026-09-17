// Deterministic resizing: preserve the supplied photo, colors and aspect ratio.
// Requires sharp in the build environment; not a runtime dependency of the app.
const sharp = require('sharp');
const path = require('node:path');
const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/prepare-icons.cjs /path/to/photo.png');
const assets = path.join(__dirname, '..', 'assets');
const background = '#0D1117';
async function main() {
  await sharp(source).rotate().resize(1024, 1024, { fit: 'contain', background })
    .flatten({ background }).removeAlpha().png().toFile(path.join(assets, 'icon.png'));
  // Photo fits inside Android's central 66/108 safe area; launcher owns the mask.
  const foreground = await sharp(source).rotate().resize(620, 620, { fit: 'inside' }).png().toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#00000000' } })
    .composite([{ input: foreground, gravity: 'centre' }]).png().toFile(path.join(assets, 'adaptive-icon.png'));
  await sharp(path.join(assets, 'icon.png')).resize(48, 48).png().toFile(path.join(assets, 'favicon.png'));
  for (const file of ['icon.png', 'adaptive-icon.png', 'favicon.png']) {
    const meta = await sharp(path.join(assets, file)).metadata();
    console.log(`${file}: ${meta.width}x${meta.height}, alpha=${meta.hasAlpha}`);
  }
}
main().catch(error => { console.error(error); process.exit(1); });
