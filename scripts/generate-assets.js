const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../apps/web/public');
const appIconSvgPath = path.join(__dirname, '../apps/web/src/app/icon.svg');

// 1. Read app icon SVG
const iconSvgContent = fs.readFileSync(appIconSvgPath, 'utf8');

// 2. OpenGraph Banner SVG (1200x630)
const ogSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#061A14"/>
      <stop offset="50%" stop-color="#0A2920"/>
      <stop offset="100%" stop-color="#04120D"/>
    </linearGradient>

    <!-- Brand Green Gradient for Text & Accents -->
    <linearGradient id="text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="50%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>

    <!-- Icon Mark Gradient -->
    <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00A36C"/>
      <stop offset="50%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>

    <linearGradient id="mark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F4F8F6"/>
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#10B981" flood-opacity="0.25"/>
    </filter>
    
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="630" fill="url(#bg-grad)"/>

  <!-- Decorative Ambient Glow Orbs -->
  <circle cx="200" cy="150" r="300" fill="#10B981" opacity="0.08" filter="blur(60px)"/>
  <circle cx="1000" cy="500" r="350" fill="#059669" opacity="0.1" filter="blur(80px)"/>

  <!-- Border Card Overlay -->
  <rect x="24" y="24" width="1152" height="582" rx="32" fill="none" stroke="#10B981" stroke-opacity="0.2" stroke-width="2"/>

  <!-- Container Content Group -->
  <g transform="translate(100, 165)">
    <!-- Logo Mark Container (180x180) -->
    <g filter="url(#shadow)" transform="translate(0, 30)">
      <rect width="180" height="180" rx="44" fill="url(#brand-grad)"/>
      <rect x="4" y="4" width="172" height="172" rx="40" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="3"/>
      
      <!-- Mark Icon Inside -->
      <g transform="translate(-45, -45) scale(0.528)" filter="url(#glow)">
        <path d="M128 360 L256 168 L384 360" fill="none" stroke="url(#mark-grad)" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M192 360 L320 192" fill="none" stroke="url(#mark-grad)" stroke-width="32" stroke-linecap="round"/>
        <circle cx="256" cy="168" r="26" fill="#FFFFFF"/>
        <circle cx="128" cy="360" r="26" fill="#FFFFFF"/>
        <circle cx="384" cy="360" r="26" fill="#FFFFFF"/>
        <circle cx="320" cy="192" r="22" fill="#FFFFFF"/>
      </g>
    </g>

    <!-- Main Text Section -->
    <g transform="translate(230, 60)">
      <!-- Brand Title -->
      <text x="0" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="76" font-weight="900" letter-spacing="-1.5" fill="url(#text-grad)">KraftPlan</text>
      
      <!-- Tagline -->
      <text x="0" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="600" fill="#ECFDF5" opacity="0.95">AI-Powered Workout Plans &amp; Progress Tracking</text>
      
      <!-- Sub-description -->
      <text x="0" y="155" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="#9CA3AF">Discover, customize, and execute structured gym workout routines.</text>
    </g>

    <!-- Feature Pills Badges Row -->
    <g transform="translate(230, 240)">
      <!-- Badge 1 -->
      <rect x="0" y="0" width="200" height="42" rx="21" fill="#064E3B" fill-opacity="0.6" stroke="#059669" stroke-width="1.5"/>
      <text x="100" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#A7F3D0" text-anchor="middle">⚡ Smart Workouts</text>

      <!-- Badge 2 -->
      <rect x="216" y="0" width="180" height="42" rx="21" fill="#064E3B" fill-opacity="0.6" stroke="#059669" stroke-width="1.5"/>
      <text x="306" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#A7F3D0" text-anchor="middle">📈 PR Analytics</text>

      <!-- Badge 3 -->
      <rect x="412" y="0" width="210" height="42" rx="21" fill="#064E3B" fill-opacity="0.6" stroke="#059669" stroke-width="1.5"/>
      <text x="517" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#A7F3D0" text-anchor="middle">🎯 Custom Routines</text>
    </g>
  </g>
</svg>`;

async function generate() {
  console.log('Generating high-res PNG icons and social preview images...');

  // Render favicon / app icons from SVG
  await sharp(Buffer.from(iconSvgContent)).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16.png'));
  await sharp(Buffer.from(iconSvgContent)).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32.png'));
  await sharp(Buffer.from(iconSvgContent)).resize(180, 180).png().toFile(path.join(publicDir, 'apple-icon.png'));
  await sharp(Buffer.from(iconSvgContent)).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(Buffer.from(iconSvgContent)).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(Buffer.from(iconSvgContent)).resize(512, 512).png().toFile(path.join(publicDir, 'icon-maskable-512.png'));
  await sharp(Buffer.from(iconSvgContent)).resize(512, 512).png().toFile(path.join(publicDir, 'logo-mark.png'));

  // Render OpenGraph Social Banner (1200x630)
  const ogBuffer = Buffer.from(ogSvgContent);
  await sharp(ogBuffer).png().toFile(path.join(publicDir, 'og-image.png'));
  await sharp(ogBuffer).png().toFile(path.join(publicDir, 'logo-kraftplan.png'));

  console.log('Successfully generated all brand assets!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
