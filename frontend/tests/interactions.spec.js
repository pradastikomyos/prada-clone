import { test, expect } from 'playwright/test';

test.describe('Interactions', () => {
  test('Homepage menu should close on Escape', async ({ page }) => {
    await page.goto('/');
    const menuToggle = page.locator('#menu-toggle');
    await menuToggle.click();

    const megaMenu = page.locator('#mega-menu');
    await expect(megaMenu).toHaveClass(/active/);

    await page.keyboard.press('Escape');
    await expect(megaMenu).not.toHaveClass(/active/);
  });

  test('Listing menu should close on Escape', async ({ page }) => {
    await page.goto('/men', { waitUntil: 'domcontentloaded' });

    const menuBtn = page.getByRole('button', { name: /open menu/i });
    await expect(menuBtn).toHaveAttribute('aria-expanded', 'false');

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

    const menuPanel = page.locator('#listing-menu-panel');
    await expect(menuPanel).toHaveClass(/is-open/);

    await page.keyboard.press('Escape');
    await expect(menuPanel).not.toHaveClass(/is-open/);
    await expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
  });

  test('Login password toggle should show/hide password', async ({ page }) => {
    await page.goto('/login');
    const continueBtn = page.locator('.btn-continue');

    await page.locator('#email').fill('test@example.com');
    await continueBtn.click();

    const passwordInput = page.locator('#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = page.locator('.password-toggle');
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('Hero video pause/play should work', async ({ page }) => {
    await page.goto('/men', { waitUntil: 'domcontentloaded' });
    const pauseBtn = page.locator('.listing-pause').first();
    const video = page.locator('.listing-hero-media').first();

    await expect(pauseBtn).toHaveAttribute('data-state', 'playing');
    await expect(pauseBtn).toHaveAttribute('aria-label', 'Pause video');

    await pauseBtn.click();
    await expect(pauseBtn).toHaveAttribute('data-state', 'paused');
    await expect(pauseBtn).toHaveAttribute('aria-label', 'Play video');
    const isPaused = await video.evaluate((node) => node.paused);
    expect(isPaused).toBe(true);

    await pauseBtn.click();
    await expect(pauseBtn).toHaveAttribute('data-state', 'playing');
    await expect(pauseBtn).toHaveAttribute('aria-label', 'Pause video');
    const isPausedAgain = await video.evaluate((node) => node.paused);
    expect(isPausedAgain).toBe(false);
  });
});
