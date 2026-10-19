// Usage:
//   node render.mjs thumbs                 -> thumbs/*.jpg (used by the render grid and the climax)
//   node render.mjs stills <dir> t1,t2,...  -> PNG stills at given seconds
//   node render.mjs frames <dir> [workers] [from] [to] -> every frame as PNG (30 fps)
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const here = path.dirname(fileURLToPath(import.meta.url));
const textos = fs.readFileSync(path.join(here, '..', 'textos.json'), 'utf8');
fs.writeFileSync(path.join(here, 'textos.js'), `window.T = ${textos};\n`);
const url = 'file://' + path.join(here, 'index.html');

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto(url);
  await page.evaluate(() => window.FILM.ready);
  return page;
}
async function shot(page, t, file, type = 'png') {
  await page.evaluate(t => window.FILM.render(t), t);
  await page.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 88 } : {}) });
}

const [mode, ...args] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });

if (mode === 'thumbs') {
  fs.mkdirSync(path.join(here, 'thumbs'), { recursive: true });
  const page = await openPage(browser);
  const times = await page.evaluate(() => window.FILM.THUMB_TIMES);
  for (const [n, t] of Object.entries(times)) await shot(page, t, path.join(here, 'thumbs', n + '.jpg'), 'jpeg');
  console.log('thumbs:', Object.keys(times).join(', '));
} else if (mode === 'stills') {
  const [dir, list] = args;
  fs.mkdirSync(dir, { recursive: true });
  const page = await openPage(browser);
  for (const t of list.split(',').map(Number)) await shot(page, t, path.join(dir, `t_${t.toFixed(2).padStart(6, '0')}.png`));
  console.log('stills done');
} else if (mode === 'frames') {
  const [dir, wk = '4', from, to] = args;
  fs.mkdirSync(dir, { recursive: true });
  const fps = 30, total = Math.round(68.5 * fps);
  const f0 = from ? +from : 0, f1 = to ? +to : total - 1;
  const workers = +wk;
  const started = Date.now();
  let done = 0;
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const page = await openPage(browser);
    for (let f = f0 + w; f <= f1; f += workers) {
      await shot(page, f / fps, path.join(dir, String(f).padStart(5, '0') + '.png'));
      if (++done % 100 === 0) console.log(`${done}/${f1 - f0 + 1} frames, ${((Date.now() - started) / 1000).toFixed(0)}s`);
    }
  }));
  console.log(`frames done: ${done} in ${((Date.now() - started) / 1000).toFixed(0)}s`);
}
await browser.close();
