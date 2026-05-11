import { expect, test } from 'playwright/test';

test('homepage exposes a visible or screen-reader page heading', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const headingCount = await page.locator('h1').count();
  expect(headingCount).toBeGreaterThan(0);
});

test('homepage menu button declares expanded state', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const menuButton = page.getByRole('button', { name: /menu/i });
  await expect(menuButton).toHaveAttribute('aria-expanded', /true|false/);
});

test('shop header icon links have accessible names', async ({ page }) => {
  await page.goto('/women', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('link', { name: /back/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /spark stage home/i })).toBeVisible();
});
