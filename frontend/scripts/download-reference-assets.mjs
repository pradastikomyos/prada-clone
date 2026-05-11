// Download reference assets listed in reference-assets.manifest.json.
// Uses realistic UA + Referer so Prada/Zara CDN accepts the request.
// Saves bytes to `public/<target>`, skips files that already exist unless
// `--force` is provided. Content type is used to decide the extension
// we save on disk (Prada serves image/avif even for URLs ending in .jpg).
//
// Usage:
//   node scripts/download-reference-assets.mjs              # download missing
//   node scripts/download-reference-assets.mjs --force      # re-download all
//   node scripts/download-reference-assets.mjs --only=prada # filter by host substring
//
// Writes the full harvest result to scripts/reference-assets.downloaded.json.

import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');
const publicRoot = resolve(repoRoot, 'public');
const manifestPath = resolve(__dirname, 'reference-assets.manifest.json');
const reportPath = resolve(__dirname, 'reference-assets.downloaded.json');

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const onlyArg = [...args].find((arg) => arg.startsWith('--only='));
const only = onlyArg ? onlyArg.slice('--only='.length) : null;

const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const defaultHeaders = {
  'User-Agent': userAgent,
  Accept: 'image/avif,image/webp,video/mp4,video/webm,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'identity',
};

const extByMime = new Map([
  ['image/avif', '.avif'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
  ['image/png', '.png'],
  ['image/gif', '.gif'],
  ['image/svg+xml', '.svg'],
  ['video/mp4', '.mp4'],
  ['video/webm', '.webm'],
]);

function normalizeContentType(raw) {
  return (raw ?? '').split(';')[0].trim().toLowerCase();
}

function expectedExtFor(target, contentType) {
  const currentExt = target.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() ?? '';
  const mimeExt = extByMime.get(contentType);
  if (!mimeExt) return target;
  if (currentExt === mimeExt) return target;
  return target.replace(/\.[a-z0-9]+$/i, mimeExt);
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${ms}ms (${label})`)), ms),
    ),
  ]);
}

async function pathExists(p) {
  try {
    const info = await stat(p);
    return info.size > 0;
  } catch {
    return false;
  }
}

async function downloadOne(asset, baseReferer) {
  const referer = asset.referer ?? baseReferer;
  const headers = { ...defaultHeaders, Referer: referer };

  const res = await withTimeout(
    fetch(asset.url, { method: 'GET', redirect: 'follow', headers }),
    120_000,
    asset.key,
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const contentType = normalizeContentType(res.headers.get('content-type'));
  const finalTarget = expectedExtFor(asset.target, contentType);
  const targetAbs = join(publicRoot, finalTarget);

  await mkdir(dirname(targetAbs), { recursive: true });
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(targetAbs, buffer);

  return {
    key: asset.key,
    bucket: asset.bucket,
    url: asset.url,
    target: `/${finalTarget.split('\\').join('/')}`,
    contentType,
    bytes: buffer.byteLength,
  };
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const assets = manifest.assets.filter((asset) => !only || asset.url.includes(only));

  console.log(
    `Harvesting ${assets.length} asset(s)${only ? ` (filter: ${only})` : ''}${force ? ' [force]' : ''}...`,
  );

  const results = [];
  const errors = [];

  for (const asset of assets) {
    const expected = expectedExtFor(asset.target, 'image/avif');
    const expectedAbs = join(publicRoot, asset.target);

    if (!force && (await pathExists(expectedAbs))) {
      console.log(`SKIP ${asset.key} (already at ${asset.target})`);
      results.push({
        key: asset.key,
        bucket: asset.bucket,
        url: asset.url,
        target: `/${asset.target.split('\\').join('/')}`,
        status: 'skipped',
      });
      continue;
    }

    try {
      const record = await downloadOne(asset, manifest.baseReferer);
      results.push({ ...record, status: 'downloaded' });
      console.log(
        `OK   ${record.key} -> ${record.target} (${record.contentType}, ${record.bytes} bytes)`,
      );
    } catch (error) {
      const message = error.message ?? String(error);
      errors.push({ key: asset.key, url: asset.url, message });
      console.log(`FAIL ${asset.key} (${asset.url}): ${message}`);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    total: assets.length,
    downloaded: results.filter((r) => r.status === 'downloaded').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    failed: errors.length,
    results,
    errors,
  };

  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log('');
  console.log(
    `Done. downloaded=${report.downloaded} skipped=${report.skipped} failed=${report.failed}. Report: ${reportPath}`,
  );

  if (errors.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
