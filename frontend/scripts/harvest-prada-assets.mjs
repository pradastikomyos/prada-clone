import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const OUTPUT_ROOT = join(ROOT, 'public', 'assets', 'harvested', 'prada');
const RAW_ROOT = join(OUTPUT_ROOT, 'raw');
const MANIFEST_PATH = join(OUTPUT_ROOT, 'manifest.json');

const seedPages = [
  {
    label: 'home',
    url: 'https://www.prada.com/ww/en.html',
  },
];

const viewports = [
  { label: 'desktop', width: 1440, height: 1100 },
  { label: 'mobile', width: 390, height: 844 },
];

const typeToFolder = new Map([
  ['image', 'images'],
  ['media', 'videos'],
  ['font', 'fonts'],
  ['stylesheet', 'css'],
  ['script', 'js'],
  ['xhr', 'json'],
  ['fetch', 'json'],
]);

const extensionByType = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/avif', '.avif'],
  ['image/svg+xml', '.svg'],
  ['video/mp4', '.mp4'],
  ['video/webm', '.webm'],
  ['font/woff', '.woff'],
  ['font/woff2', '.woff2'],
  ['text/css', '.css'],
  ['application/javascript', '.js'],
  ['text/javascript', '.js'],
  ['application/json', '.json'],
]);

function normalizeContentType(value = '') {
  return value.split(';')[0].trim().toLowerCase();
}

function shouldSave(resourceType, contentType, url) {
  if (['image', 'media', 'font', 'stylesheet', 'script'].includes(resourceType)) return true;
  if (['xhr', 'fetch'].includes(resourceType) && contentType.includes('json')) return true;
  return /\.(jpe?g|png|webp|avif|svg|mp4|webm|woff2?|css|js|json)(\?|$)/i.test(url);
}

function extensionFor(url, contentType) {
  const fromType = extensionByType.get(contentType);
  if (fromType) return fromType;

  try {
    const pathname = new URL(url).pathname;
    const ext = extname(pathname);
    return ext || '.bin';
  } catch {
    return '.bin';
  }
}

function folderFor(resourceType, contentType) {
  if (contentType.includes('json')) return 'json';
  return typeToFolder.get(resourceType) ?? 'misc';
}

function slugFor(url) {
  try {
    const pathname = new URL(url).pathname;
    const basename = pathname.split('/').filter(Boolean).pop() ?? 'asset';
    return basename
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[^a-z0-9_-]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'asset';
  } catch {
    return 'asset';
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    const step = Math.max(300, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    window.scrollTo(0, 0);
  });
}

async function revealMenu(page) {
  const menuButton = page.getByRole('button', { name: /menu/i });
  if (!(await menuButton.count())) return;

  await menuButton.click();
  for (const label of ['New Arrivals', 'Women', 'Men', 'Bags']) {
    const item = page.getByText(label, { exact: true }).first();
    if (await item.count()) {
      await item.hover().catch(() => {});
      await page.waitForTimeout(300);
    }
  }
}

async function main() {
  const entries = new Map();
  const browser = await chromium.launch();

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      serviceWorkers: 'block',
    });

    const page = await context.newPage();

    page.on('response', async response => {
      const request = response.request();
      const url = response.url();
      const status = response.status();
      const contentType = normalizeContentType(response.headers()['content-type']);
      const resourceType = request.resourceType();

      if (status !== 200 || entries.has(url)) return;
      if (!shouldSave(resourceType, contentType, url)) return;

      try {
        const body = await response.body();
        if (!body.length) return;

        const sha256 = createHash('sha256').update(body).digest('hex');
        const ext = extensionFor(url, contentType);
        const folder = folderFor(resourceType, contentType);
        const filename = `${sha256.slice(0, 12)}-${slugFor(url)}${ext}`;
        const relativePath = `/assets/harvested/prada/raw/${folder}/${filename}`;
        const absolutePath = join(RAW_ROOT, folder, filename);

        await mkdir(join(RAW_ROOT, folder), { recursive: true });
        await writeFile(absolutePath, body);

        entries.set(url, {
          sourceUrl: url,
          localPath: relativePath,
          contentType,
          resourceType,
          bytes: body.length,
          sha256,
          status,
          pageUrl: page.url(),
          viewport: viewport.label,
          capturedAt: new Date().toISOString(),
          usedBy: [],
        });
      } catch (error) {
        console.warn(`Skipping ${url}: ${error.message}`);
      }
    });

    for (const seed of seedPages) {
      console.log(`Capturing ${seed.label} (${viewport.label})`);
      await page.goto(seed.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForTimeout(2_000);
      await autoScroll(page);
      await revealMenu(page);
      await page.waitForTimeout(2_000);
    }

    await context.close();
  }

  await browser.close();

  const manifest = {
    generatedAt: new Date().toISOString(),
    assets: [...entries.values()].sort((a, b) => a.sourceUrl.localeCompare(b.sourceUrl)),
  };

  await mkdir(OUTPUT_ROOT, { recursive: true });
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Saved ${manifest.assets.length} assets to ${MANIFEST_PATH}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
