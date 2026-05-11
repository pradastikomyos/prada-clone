import { expect, test } from 'playwright/test';

test('captures homepage top state', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.screenshot({
    path: testInfo.outputPath(`homepage-top-${testInfo.project.name}.png`),
    fullPage: false,
  });

  await expect(page.locator('.hero-section').first()).toBeVisible();
});

test('captures mega menu open state', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /menu/i }).click();
  await expect(page.locator('#mega-menu')).toHaveClass(/active/);

  await page.screenshot({
    path: testInfo.outputPath(`mega-menu-${testInfo.project.name}.png`),
    fullPage: false,
  });
});

test('captures product grid state', async ({ page }, testInfo) => {
  await page.goto('/women.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.product-grid').first()).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath(`women-grid-${testInfo.project.name}.png`),
    fullPage: true,
  });
});

test('captures Prada-style new arrivals listing', async ({ page }, testInfo) => {
  await page.goto('/new-arrivals.html', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: "Women's New Arrivals" })).toBeVisible();
  await expect(page.locator('.listing-toolbar')).toContainText('276 PRODUCTS');
  await expect(page.locator('.prada-product-card')).toHaveCount(9);

  await page.screenshot({
    path: testInfo.outputPath(`new-arrivals-listing-${testInfo.project.name}.png`),
    fullPage: false,
  });
});

test('captures Prada-style mens new arrivals listing', async ({ page }, testInfo) => {
  await page.goto('/men.html', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: "Men's New Arrivals" })).toBeVisible();
  await expect(page.locator('.listing-toolbar')).toContainText('720 PRODUCTS');
  await expect(page.locator('.listing-hero video')).toBeVisible();
  await expect(page.locator('.prada-product-card')).toHaveCount(9);

  await page.screenshot({
    path: testInfo.outputPath(`mens-new-arrivals-listing-${testInfo.project.name}.png`),
    fullPage: false,
  });
});

for (const route of ['/new-arrivals.html', '/men.html']) {
  test(`listing menu opens and closes on ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });

    // ListingHeader renders <ListingMenu />. Its trigger exposes
    // aria-label="Open menu" and aria-expanded that toggles the panel.
    const menuButton = page.getByRole('button', { name: /open menu/i });
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#listing-menu-panel')).not.toHaveClass(/is-open/);

    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    const panel = page.locator('#listing-menu-panel');
    await expect(panel).toHaveClass(/is-open/);
    await expect(panel).toBeVisible();

    // Pick the "New Arrivals" category inside the open panel. Hovering the
    // button mutates its className (is-active) and adds `has-active-category`
    // on its parent nav, which triggers a layout shift. `force: true`
    // bypasses Playwright's stability check since the click target itself
    // stays in the tree.
    const newArrivalsButton = panel
      .locator('.listing-menu-categories')
      .getByRole('button', { name: /^new arrivals$/i });
    await newArrivalsButton.click({ force: true });

    const content = page.locator('.listing-menu-content');
    await expect(content).toContainText("Women's New Arrivals");
    await expect(content).toContainText("Men's New Arrivals");

    await page.keyboard.press('Escape');
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).not.toHaveClass(/is-open/);
  });
}

test('captures login state', async ({ page }, testInfo) => {
  await page.goto('/login.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.login-form')).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath(`login-${testInfo.project.name}.png`),
    fullPage: true,
  });
});
