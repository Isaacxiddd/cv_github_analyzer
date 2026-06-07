import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dirname, 'demo-mockup.html');
const outPath = join(__dirname, '..', 'screenshots', 'demo.png');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 560, height: 900 } });
await page.goto('file://' + htmlPath.replace(/\\/g, '/'));
await page.waitForTimeout(500);

const body = await page.locator('body');
await body.screenshot({ path: outPath });

await browser.close();
console.log('Screenshot saved to', outPath);
