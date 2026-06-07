import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync } from 'fs';

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

copyFileSync('public/manifest.json', 'dist/manifest.json');
copyFileSync('src/popup/popup.html',  'dist/popup.html');
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
