import * as esbuild from 'esbuild';
import { cpSync, copyFileSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const watch = process.argv.includes('--watch');

mkdirSync('dist', { recursive: true });

const buildOptions: esbuild.BuildOptions = {
  entryPoints: [
    { in: 'src/popup/popup.ts',         out: 'dist/popup' },
    { in: 'src/background/background.ts', out: 'dist/background' },
    { in: 'src/content/content.ts',         out: 'dist/content' },
    { in: 'src/content/portfolio-detector.ts', out: 'dist/portfolio-detector' },
  ],
  bundle: true,
  target: 'chrome120',
  format: 'esm',
  sourcemap: watch ? 'inline' : false,
  minify: !watch,
  outdir: '.',
  define: {},
};

cpSync('public', 'dist', { recursive: true });
copyFileSync('src/popup/popup.html',  'dist/popup.html');

// Convert SVG icons to PNG (Chrome requires PNG for extension icons)
const iconSizes = [16, 32, 48, 128, 512];
for (const size of iconSizes) {
  const svg = join('public', 'icons', `logo_${size}.svg`);
  const png = join('dist', 'icons', `logo_${size}.png`);
  await sharp(svg).resize(size, size).png().toFile(png);
}

// Remove SVG copies from dist (manifest uses PNGs)
const distIcons = join('dist', 'icons');
for (const file of readdirSync(distIcons).filter(f => f.endsWith('.svg'))) {
  rmSync(join(distIcons, file));
}
copyFileSync('node_modules/pdfjs-dist/build/pdf.worker.min.mjs', 'dist/pdf.worker.min.js');
copyFileSync('node_modules/pdfjs-dist/build/pdf.mjs', 'dist/pdf.mjs');

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('[esbuild] Watching for changes…');
} else {
  await esbuild.build(buildOptions);
  console.log('[esbuild] Build complete → dist/');
}
