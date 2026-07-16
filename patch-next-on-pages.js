// patch-next-on-pages.js
// Patches f2() in @cloudflare/next-on-pages to use execSync instead of shellac
// This fixes the Windows issue where shellac can't capture stdout from pnpm/npm

const fs = require('fs');
const path = require('path');

// Find the index.js
const base = path.join(
  __dirname,
  'node_modules/.pnpm'
);

// Search for the file
function findFile(dir, target) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      const found = findFile(full, target);
      if (found) return found;
    } else if (item === target && full.includes('next-on-pages') && full.includes('dist')) {
      return full;
    }
  }
  return null;
}

const indexFile = path.join(
  __dirname,
  'node_modules/.pnpm/@cloudflare+next-on-pages@1.13.16_@cloudflare+workers-types@4.20260702.1_next@14.2.35_react-d_idqcsjll67f62ui5itoyg24i3q/node_modules/@cloudflare/next-on-pages/dist/index.js'
);

let content = fs.readFileSync(indexFile, 'utf8');

// The original function uses shellac template literal
const oldPattern = /async function f2\(n4\) \{\n  const \{ stdout: e2 \} = await l4`\$ \$\{n4\} --version`;\n  return e2;\n\}/;

const newFunc = `async function f2(n4) {
  const { execSync: _execSync } = require('child_process');
  try { return _execSync(n4 + ' --version', { encoding: 'utf8', shell: true }).trim(); } catch(e) { return '0.0.0'; }
}`;

if (oldPattern.test(content)) {
  content = content.replace(oldPattern, newFunc);
  fs.writeFileSync(indexFile, content, 'utf8');
  console.log('✅ Patched f2() in next-on-pages/dist/index.js');
} else {
  // Check if already patched
  if (content.includes('execSync: _execSync')) {
    console.log('ℹ️  Already patched!');
  } else {
    console.log('❌ Could not find target pattern to patch');
    // Show what's around f2
    const idx = content.indexOf('async function f2(');
    if (idx >= 0) {
      console.log('Current f2:', JSON.stringify(content.substring(idx, idx + 200)));
    }
    process.exit(1);
  }
}
