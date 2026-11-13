// Renders the 3D night map scenes and the flight video.
// Usage: npx vite --port 5199 & node design/directions/d-3d/render.mjs [scene...]
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = dirname(fileURLToPath(import.meta.url));
const base = process.env.BASE ?? 'http://127.0.0.1:5199/design/directions/d-3d/index.html';
const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'];
const viewport = { width: 390, height: 844 };

const shots = [
  ['republika', '01-republika.png'],
  ['vesnice', '02-vesnice-3d.png'],
  ['karta', '03-karta-domecku.png'],
  ['navigovat', '04-navigovat.png'],
  ['pred', '05-pred-adventem.png'],
];
const only = process.argv.slice(2);

const executablePath = process.env.CHROME ?? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const browser = await chromium.launch({ args, executablePath: existsSync(executablePath) ? executablePath : undefined });

for (const [scene, file] of shots) {
  if (only.length && !only.includes(scene) && !only.includes('shots')) continue;
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && console.log(scene, 'console:', m.text()));
  await page.goto(`${base}?scene=${scene}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120_000 });
  await page.waitForTimeout(1500);
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(out, file) });
  console.log('wrote', file);
  await ctx.close();
}

if (!only.length || only.includes('let')) {
  // Frame by frame under a paused page clock: smooth 30 fps no matter how slow software WebGL is.
  const frames = join(out, '.frames');
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames);
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.clock.install();
  await page.goto(`${base}?scene=let`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 180_000, polling: 50 });
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 5);
  const fps = 30;
  let tail = 0;
  for (let i = 0; i < fps * 14; i++) {
    await page.clock.runFor(1000 / fps);
    await page.waitForFunction(() => window.map.areTilesLoaded(), null, { timeout: 4000, polling: 40 }).catch(() => {});
    await page.waitForTimeout(30);
    await page.clock.runFor(1);
    await page.screenshot({ path: join(frames, `f${String(i).padStart(4, '0')}.png`) });
    if (await page.evaluate(() => window.__flightDone === true)) tail++;
    if (tail > fps * 1.5) break;
  }
  await ctx.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(frames, 'f%04d.png'), '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '30', '-row-mt', '1', '-pix_fmt', 'yuv420p', join(out, 'let-do-vesnice.webm')]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(frames, 'f%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', join(out, 'let-do-vesnice.mp4')]);
  rmSync(frames, { recursive: true, force: true });
  console.log('wrote let-do-vesnice.webm and .mp4');
}

await browser.close();

