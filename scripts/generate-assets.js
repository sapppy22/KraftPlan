/**
 * KraftPlan brand asset generator.
 *
 * Source of truth: scripts/brand-source/logo-mark-orange.png — the original
 * "crossed-dumbbell K over a peak" illustration. We recolor it from the legacy
 * orange/amber into the KraftPlan green/white/black palette with a luminance
 * gradient-map (duotone), then emit every favicon, app icon, maskable icon and
 * the OpenGraph social banner from that single green master. Re-run with:
 *   node scripts/generate-assets.js
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../apps/web/public');
const sourceMark = path.join(__dirname, 'brand-source/logo-mark-orange.png');

// Luminance ramp → green/white/black. Dark end holds the charcoal background,
// mids move through emerald, brightest highlights resolve to white.
const RAMP = [
  [0.0, [0x0a, 0x0f, 0x0c]], // near-black brand background
  [0.2, [0x0a, 0x0f, 0x0c]],
  [0.36, [0x05, 0x6a, 0x4b]], // deep emerald
  [0.55, [0x00, 0xa3, 0x6c]], // brand green
  [0.74, [0x2a, 0xc7, 0x8a]], // mint
  [0.9, [0xbf, 0xf7, 0xe4]], // pale mint
  [1.0, [0xff, 0xff, 0xff]], // white highlight
];

function rampAt(l) {
  for (let i = 1; i < RAMP.length; i++) {
    if (l <= RAMP[i][0]) {
      const [l0, c0] = RAMP[i - 1];
      const [l1, c1] = RAMP[i];
      const t = (l - l0) / (l1 - l0 || 1);
      return [0, 1, 2].map((k) => Math.round(c0[k] + (c1[k] - c0[k]) * t));
    }
  }
  return RAMP[RAMP.length - 1][1];
}

/** Recolor the orange master into the green palette; returns a 512px RGBA buffer. */
async function greenMaster() {
  const { data, info } = await sharp(sourceMark)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = channels === 4 ? data[i + 3] : 255;
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const s = mx === 0 ? 0 : (mx - mn) / mx;
    // Saturated (mark) pixels climb the ramp; flat/dark background stays low.
    const lEff = Math.min(1, l * (0.55 + 0.9 * s) + 0.05);
    const [nr, ng, nb] = rampAt(lEff);
    out[i] = nr;
    out[i + 1] = ng;
    out[i + 2] = nb;
    if (channels === 4) out[i + 3] = a;
  }
  // Upscale the recolored master to 512 for crisp downstream resizes.
  return sharp(out, { raw: { width, height, channels } })
    .resize(512, 512, { kernel: 'lanczos3' })
    .png()
    .toBuffer();
}

async function generate() {
  console.log('Recoloring master → green and generating brand assets…');
  const master = await greenMaster();

  // Favicons & app icons (transparent rounded corners preserved).
  const sizes = {
    'favicon-16.png': 16,
    'favicon-32.png': 32,
    'apple-icon.png': 180,
    'icon-192.png': 192,
    'icon-512.png': 512,
    'logo-mark.png': 512,
  };
  for (const [file, size] of Object.entries(sizes)) {
    await sharp(master).resize(size, size).png().toFile(path.join(publicDir, file));
  }

  // Maskable icon: full-bleed on the dark brand background (no transparent corners).
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: '#0A0F0C' },
  })
    .composite([{ input: await sharp(master).resize(512, 512).png().toBuffer() }])
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));

  // Crisp SVG favicon that embeds the exact green raster (keeps every surface identical).
  const faviconPng = await sharp(master).resize(128, 128).png().toBuffer();
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <image href="data:image/png;base64,${faviconPng.toString('base64')}" width="128" height="128"/>
</svg>`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);
  // Next.js file-based icon (src/app/icon.svg) — keep it identical to the favicon.
  fs.writeFileSync(path.join(__dirname, '../apps/web/src/app/icon.svg'), faviconSvg);

  // OpenGraph social banner (1200×630) — dark banner + green mark + green wordmark.
  const ogMarkSize = 200;
  const ogBanner = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#061A14"/>
      <stop offset="50%" stop-color="#0A2920"/>
      <stop offset="100%" stop-color="#04120D"/>
    </linearGradient>
    <linearGradient id="text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="50%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg-grad)"/>
  <circle cx="200" cy="150" r="300" fill="#10B981" opacity="0.08"/>
  <circle cx="1000" cy="500" r="350" fill="#059669" opacity="0.10"/>
  <rect x="24" y="24" width="1152" height="582" rx="32" fill="none" stroke="#10B981" stroke-opacity="0.2" stroke-width="2"/>
  <!-- Framing ring where the green mark is composited -->
  <rect x="122" y="212" width="${ogMarkSize + 4}" height="${ogMarkSize + 4}" rx="48" fill="none" stroke="#10B981" stroke-opacity="0.28" stroke-width="3"/>
  <g transform="translate(360, 250)">
    <text x="0" y="10" font-family="system-ui, -apple-system, sans-serif" font-size="82" font-weight="900" letter-spacing="-2" fill="url(#text-grad)">KraftPlan</text>
    <text x="0" y="66" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="600" fill="#ECFDF5" opacity="0.95">AI-Powered Workout Plans &amp; Progress Tracking</text>
    <text x="0" y="112" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="#9CA3AF">Discover, customize, and execute structured gym routines.</text>
  </g>
</svg>`;
  const bannerPng = await sharp(Buffer.from(ogBanner)).png().toBuffer();
  const ogMarkPng = await sharp(master).resize(ogMarkSize, ogMarkSize).png().toBuffer();
  const composed = await sharp(bannerPng)
    .composite([{ input: ogMarkPng, left: 124, top: 214 }])
    .png()
    .toBuffer();
  await sharp(composed).toFile(path.join(publicDir, 'og-image.png'));
  await sharp(composed).toFile(path.join(publicDir, 'logo-kraftplan.png'));

  console.log('✓ Generated favicons, app icons, maskable icon, favicon.svg and OG banner.');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
