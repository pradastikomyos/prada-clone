import { expect, test } from 'playwright/test';

const routes = [
  { path: '/', title: /Spark Stage - Official Website/ },
  { path: '/women.html', title: /Spark Stage - Women/ },
  { path: '/men.html', title: /New-in Apparel for Men | Spark Stage/ },
  { path: '/new-arrivals.html', title: /New-in Apparel for Women | Spark Stage/ },
  { path: '/login.html', title: /Spark Stage - Log In or Sign Up/ },
];

/**
 * Domains we still allow to fail quietly even if a request or console error
 * mentions them. Keep this list intentionally small — anything added here
 * stops being guarded against.
 */
const EXTERNAL_SOFT_FAIL_HOSTS = [
  // Supabase env may not be configured locally. If it is configured but returns
  // an error, we still surface it below — only *network-level* unreachable calls
  // are tolerated.
  'supabase.co',
  // DOKU sandbox. Not used unless the checkout demo is exercised from a test.
  'doku.com',
];

function hostMatches(url, allowedHosts) {
  return allowedHosts.some((host) => url.hostname.endsWith(host));
}

function attachRuntimeChecks(page) {
  const failures = [];

  page.on('pageerror', (error) => {
    failures.push(`pageerror: ${error.message}`);
  });

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    // React dev warnings occasionally come through as console.error.
    // We still let real app errors through.
    if (text.includes('Download the React DevTools')) return;
    failures.push(`console error: ${text}`);
  });

  page.on('requestfailed', (request) => {
    const url = new URL(request.url());
    if (url.origin === 'http://127.0.0.1:5173') {
      failures.push(
        `local request failed: ${request.resourceType()} ${request.url()} ${request.failure()?.errorText ?? ''}`,
      );
      return;
    }
    if (hostMatches(url, EXTERNAL_SOFT_FAIL_HOSTS)) return;
    failures.push(
      `external request failed: ${request.resourceType()} ${request.url()} ${request.failure()?.errorText ?? ''}`,
    );
  });

  page.on('response', (response) => {
    const url = new URL(response.url());
    if (response.status() < 400) return;
    if (url.origin === 'http://127.0.0.1:5173') {
      failures.push(`local http ${response.status()}: ${response.url()}`);
      return;
    }
    if (hostMatches(url, EXTERNAL_SOFT_FAIL_HOSTS)) return;
    failures.push(`external http ${response.status()}: ${response.url()}`);
  });

  return failures;
}

for (const route of routes) {
  test(`${route.path} loads without local runtime failures`, async ({ page }) => {
    const failures = attachRuntimeChecks(page);

    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(route.title);
    await expect(page.locator('body')).toBeVisible();

    expect(failures).toEqual([]);
  });
}
