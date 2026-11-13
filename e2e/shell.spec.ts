import { expect, test } from '@playwright/test';
import { strings } from '../src/strings.cs';

test('serves a dark Czech page titled Adventní okénka', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(strings.appTitle);
  await expect(page.locator('html')).toHaveAttribute('lang', 'cs');
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
  await expect(page.getByRole('heading', { level: 1, name: strings.appTitle })).toBeVisible();

  const background = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  const rgb = (background.match(/\d+/g) ?? []).slice(0, 3).map(Number);
  expect(rgb).toHaveLength(3);
  expect(Math.max(...rgb)).toBeLessThan(40);
});

test('has no horizontal scroll at 390 px', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('falls back to the app for unknown paths', async ({ page }) => {
  await page.goto('/radlo');
  await expect(page).toHaveTitle(strings.appTitle);
});
