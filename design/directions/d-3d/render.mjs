// Renders the 3D night map scenes and the two clips.
// Usage: npx vite --port 5199 & node design/directions/d-3d/render.mjs [scene... | shots | let | soumrak]
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = dirname(fileURLToPath(import.meta.url));
const base = process.env.BASE ?? 'http://127.0.0.1:5199/design/directions/d-3d/index.html';
const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'];
const viewport = { width: 390, height: 844 };
/** A simulated phone on the edge of Rádlo. */
const RADLO = { latitude: 50.69652, longitude: 15.11146, accuracy: 25 };

const shots = [
  ['start', '01-start-poloha.png', RADLO],
  ['republika', '01-republika.png'],
  ['vesnice', '02-vesnice-3d.png'],
  ['karta', '03-karta-domecku.png'],
  ['navigovat', '04-navigovat.png'],
  ['pred', '05-pred-adventem.png'],
  ['evropa', '06-evropa.png'],
  ['zeme', '07-zemekoule.png'],
  ['den', '08-den.png'],
  ['den-republika', '09-den-republika.png'],
  ['znacka', '10-znacka.png'],
];
const only = process.argv.slice(2);
const wanted = (scene) => !only.length || only.includes(scene) || only.includes('shots');

const executablePath = process.env.CHROME ?? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const browser = await chromium.launch({ args, executablePath: existsSync(executablePath) ? executablePath : undefined });

for (const [scene, file, geo] of shots) {
  if (!wanted(scene)) continue;
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    ...(geo ? { geolocation: geo, permissions: ['geolocation'] } : {}),
  });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && console.log(scene, 'console:', m.text()));
  await page.goto(`${base}?scene=${scene}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 180_000 });
  await page.waitForTimeout(2600);
  await page.screenshot({ path: join(out, file) });
  console.log('wrote', file);
  await ctx.close();
}

/** Frame by frame under a paused page clock: smooth 30 fps no matter how slow software WebGL is. */
async function clip(scene, name, maxSeconds) {
  const frames = join(out, '.frames');
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames);
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.clock.install();
  await page.goto(`${base}?scene=${scene}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 180_000, polling: 50 });
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 5);
  const fps = 30;
  let tail = 0;
  for (let i = 0; i < fps * maxSeconds; i++) {
    await page.clock.runFor(1000 / fps);
    await page.waitForFunction(() => window.map.areTilesLoaded(), null, { timeout: 5000, polling: 40 }).catch(() => {});
    await page.waitForTimeout(30);
    await page.clock.runFor(1);
    await page.screenshot({ path: join(frames, `f${String(i).padStart(4, '0')}.png`) });
    if (await page.evaluate(() => window.__flightDone === true)) tail++;
    if (tail > fps * 1.2) break;
  }
  await ctx.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(frames, 'f%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', join(out, `${name}.mp4`)]);
  rmSync(frames, { recursive: true, force: true });
  console.log(`wrote ${name}.mp4`);
}

if (!only.length || only.includes('let')) await clip('let', 'let-ze-zeme', 16);
if (!only.length || only.includes('soumrak')) await clip('soumrak', 'soumrak', 10);

await browser.close();
