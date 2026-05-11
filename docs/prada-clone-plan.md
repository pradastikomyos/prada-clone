# Prada.com Clone Plan

Private learning project plan for improving this Prada-inspired clone while keeping the implementation maintainable, testable, and close to the real site experience.

## Goals

- Recreate the current Prada.com storefront feel as closely as practical for local learning and testing.
- Use real captured reference assets where needed, especially hero media, product images, and layout-critical imagery.
- Avoid random generated imagery because mismatched images can break the visual rhythm and luxury retail styling.
- Move from scattered static files toward a predictable `frontend/` Vite project structure with root `supabase/`.
- Keep all downloaded assets local under `frontend/public/assets/` so the project does not depend on hotlinked Prada CDN URLs during local development.
- Verify every major page visually with Playwright screenshots across desktop and mobile.

## Current Project Snapshot

- Stack: React + TypeScript + Vite baseline, current static HTML/CSS/JavaScript pages, GSAP, Playwright.
- Frontend app lives under `frontend/`; Supabase config/functions/migrations stay under root `supabase/`.
- Main active page: `frontend/index.html` with `frontend/main.js` and `frontend/style.css`.
- Secondary pages: `frontend/men.html`, `frontend/women.html`, `frontend/new-arrivals.html`, `frontend/login.html`.
- Shop styling is shared through `frontend/shop.css`; login styling is in `frontend/login.css`.
- React migration baseline exists in `frontend/src/`; current static pages remain visual references while pages are ported.
- `npm run build` should be run from `frontend/` and currently emits all configured HTML pages.
- Remote Prada font loading can fail because of CORS, so local font strategy or high-quality fallback fonts are needed.

## Recommended Approach

Use Playwright as the source-of-truth browser harvester, not HTTrack as the main clone tool. HTTrack and wget can mirror simple static pages, but Prada.com is a modern site with dynamic assets, responsive variants, videos, and interaction-triggered requests. Playwright can load the real page, scroll it, open menus, switch viewports, capture network responses, and save only the assets we actually need.

Seed Prada URLs should use stable locale-specific routes where possible, starting with `https://www.prada.com/ww/en.html`, then the current women, men, new arrivals, and account/login routes discovered from the live navigation.

Preferred workflow:

1. Capture Prada.com reference states with Playwright.
2. Harvest real network assets into `public/assets/harvested/prada/`.
3. Store curated URL-to-local-path mappings in `public/assets/reference/prada/metadata/manifest.json`.
4. Refactor local HTML/CSS/JS to use local assets.
5. Rebuild page by page, comparing screenshots against references.
6. Repeat until layout, spacing, typography, motion, and responsive behavior are close.

## Proposed File Structure

```text
docs/
  prada-clone-plan.md
  reference-notes.md
  visual-audit.md

scripts/
  harvest-prada-assets.mjs
  rewrite-asset-urls.mjs
  capture-reference-screenshots.mjs
  visual-check.mjs

frontend/public/
  assets/
    reference/
      prada/
        metadata/
          manifest.json
        men-new-arrivals/
          hero/
          products/
    harvested/
      prada/
        manifest.json
        raw/
          images/
          videos/
          fonts/
          css/
          js/
          json/
        normalized/
          images/
          videos/
          fonts/
        screenshots/
src/
  pages/
    home.js
    men.js
    women.js
    new-arrivals.js
    login.js
  data/
    navigation.js
    products.js
    assets.js
  styles/
    base.css
    header.css
    mega-menu.css
    home.css
    shop.css
    login.css
    responsive.css
```

This can be done incrementally. We do not need to move everything at once if that slows progress.

## Asset Harvesting Strategy

Create `scripts/harvest-prada-assets.mjs` using local Playwright. The raw capture path should be `public/assets/harvested/prada/raw/`; curated assets that the app actually imports can later be copied or normalized into `public/assets/reference/prada/`.

The script should:

- Launch Chromium with realistic desktop and mobile viewports.
- Visit `https://www.prada.com/`.
- Wait for network idle where practical.
- Auto-scroll through the homepage to trigger lazy-loaded images and videos.
- Open the mega menu and hover/click major categories.
- Visit target pages for women, men, new arrivals, and account/login references.
- Listen for `response` or `requestfinished` events.
- Filter assets by resource type and extension:
  - Images: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.svg`
  - Video: `.mp4`, `.webm`, `.m3u8` if present
  - Fonts: `.woff`, `.woff2`
  - CSS files if they include useful font or layout references
  - Selected JSON only when it contains public product/content data needed for layout
- Save downloaded buffers with stable local names.
- Write `manifest.json` containing:
  - original URL
  - local path
  - content type
  - resource type
  - page/state where it was discovered
  - byte size
  - timestamp

Important constraints:

- Avoid crawling the entire domain. Capture selected pages and states only.
- Avoid downloading huge irrelevant videos repeatedly.
- Deduplicate by normalized URL and response hash when possible.
- Use content-addressed filenames where practical, for example `sha256-short-slug.ext`.
- Keep large raw captures out of source control if the repository will ever be shared.
- Do not capture analytics, auth endpoints, cookies, account data, or personalized API responses.

Manifest entry shape:

```json
{
  "sourceUrl": "https://www.prada.com/content/dam/example.jpg",
  "localPath": "/assets/harvested/prada/raw/images/sha256-example.jpg",
  "contentType": "image/jpeg",
  "resourceType": "image",
  "bytes": 123456,
  "sha256": "example",
  "status": 200,
  "pageUrl": "https://www.prada.com/ww/en.html",
  "capturedAt": "2026-05-06T00:00:00.000Z",
  "usedBy": []
}
```

## Reference Capture Strategy

Create `scripts/capture-reference-screenshots.mjs`.

Capture these reference states:

- Homepage desktop at top, mid-scroll sections, and footer if present.
- Homepage mobile at top and scrolled.
- Mega menu closed/open.
- Mega menu with New Arrivals, Women, Men, Bags selected.
- Women category/listing page.
- Men category/listing page.
- New arrivals listing page.
- Account/login page.

Suggested viewport matrix:

- Desktop: `1440x1100`
- Laptop: `1280x900`
- Tablet: `768x1024`
- Mobile: `390x844`

Save screenshots under:

```text
docs/reference/prada/
  desktop-home-top.png
  desktop-home-menu-women.png
  mobile-home-top.png
  mobile-menu-open.png
```

## Playwright Verification Strategy

Add a real Playwright test harness rather than relying only on manual MCP browsing.

Recommended files:

```text
playwright.config.js
tests/
  smoke.spec.js
  visual.spec.js
  accessibility.spec.js
```

Recommended package scripts:

```json
{
  "test:e2e": "playwright test",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:update": "playwright test --update-snapshots"
}
```

The Playwright config should:

- Start Vite through `webServer`.
- Test against both dev and preview flows when practical.
- Include desktop and mobile projects.
- Capture traces on retry.
- Store screenshots and traces under `test-results/`.
- Fail on page errors, console errors, failed document/script/style/font/image/media requests, and HTTP responses `>= 400`.

Core smoke routes:

- `/`
- `/women.html`
- `/men.html`
- `/new-arrivals.html`
- `/login.html`

Core screenshot states:

- Homepage top and mid-scroll hero sections.
- Homepage mega menu open.
- Mega menu category states: New Arrivals, Women, Men, Bags.
- Women, men, and new arrivals product grids.
- Login desktop split view.
- Login mobile stacked view.

## Frontend Refactor Plan

Phase 1 should keep the project simple, then Phase 2 can consolidate structure.

Phase 1:

- Add `vite.config.js` with explicit multi-page inputs for all HTML pages.
- Keep consistent paths: `/`, `/women.html`, `/men.html`, `/new-arrivals.html`, `/login.html`.
- Replace `/vite.svg` favicon with existing `public/favicon.svg` or a neutral local icon.
- Move inline login JavaScript into a dedicated module.
- Add guard checks in `main.js` before binding menu/header events, so scripts do not crash if reused on another page.
- Replace hotlinked hero/product media with local manifest-backed assets.
- Fix mojibake currency strings such as `â‚¬` so prices render as `EUR` or a valid euro symbol consistently.
- Replace `href="#"` placeholders with real local routes, disabled buttons, or explicit `aria-disabled` states.
- Add a page-level accessible heading strategy; the homepage should not rely only on multiple `<h2>` hero headings.
- Add visible focus states where CSS currently removes outlines.
- Add `prefers-reduced-motion` handling for GSAP and transition-heavy states.
- Remove unused `src/` scaffold only after confirming no files are needed.

Phase 2:

- Extract shared header, logo, mega menu, product card, and page data into reusable modules.
- Centralize product/category data in `src/data/products.js`.
- Centralize navigation/mega menu data in `src/data/navigation.js`.
- Add `src/data/heroSections.js` for homepage editorial sections and local asset references.
- Split CSS by responsibility: base, header, mega menu, home, shop, login, responsive.
- Add `tokens.css` for fonts, colors, spacing, z-index, and breakpoints; add `base.css` for reset/body/link/media defaults.
- Keep visual pages static where possible; avoid introducing a framework unless the project grows beyond plain JS.

## Page Implementation Plan

Homepage:

- Match Prada's full-viewport editorial hero rhythm.
- Use local video/image assets for hero sections.
- Keep header transparent on top and white on scroll.
- Tune GSAP parallax so motion is subtle and does not crop important product/editorial details.
- Make mobile hero copy and CTAs fit without overlapping media.

Mega menu:

- Rebuild category interactions from captured Prada reference states.
- Support hover on desktop and tap on mobile.
- Add keyboard handling: Escape to close, focus return to menu button.
- Add accessibility labels to icon-only controls.
- Convert clickable category `<li>` elements to buttons or add proper roles, tabindex, and keyboard behavior.
- Add `aria-expanded` on the menu button.
- Add `role="dialog"` or equivalent semantics for the overlay where appropriate.
- Ensure menu body scrolls independently on small screens.

Product/category pages:

- Use real Prada product imagery harvested from relevant pages.
- Normalize product card aspect ratios.
- Add category sections, filters/sort placeholders, and stable grid behavior.
- Make product names/prices consistent and clean.
- Keep mobile grid readable and avoid oversized whitespace.

Login/account page:

- Match the current split-screen luxury retail feel.
- Replace external Zara image with local reference-matched asset.
- Move inline script to a module.
- Replace `alert()` placeholders with local UI state messages.
- Keep form behavior fake/local unless backend auth is intentionally added later.

## Comprehensive Todo List

### Discovery

- [ ] Capture current Prada.com homepage screenshots on desktop and mobile.
- [ ] Capture mega menu screenshots for major category states.
- [ ] Capture women, men, new arrivals, and account/login reference pages.
- [ ] Record notes on typography, spacing, header behavior, menu behavior, product grid density, and mobile breakpoints.
- [ ] Identify which current local pages are worth keeping versus rebuilding.
- [x] Decide exact page scope for v1: homepage, mega menu, women, men, new arrivals, login.

### Asset Harvesting

- [x] Create `scripts/harvest-prada-assets.mjs`.
- [x] Add Playwright network listeners for images, media, fonts, and CSS.
- [x] Add desktop capture route for homepage and menu states.
- [x] Add mobile capture route for homepage and menu states.
- [x] Add selected product/category page capture routes.
- [ ] Save curated assets under `public/assets/reference/prada/` with stable names.
- [ ] Generate `public/assets/reference/prada/metadata/manifest.json`.
- [ ] Deduplicate duplicate CDN renditions.
- [ ] Limit very large video downloads or mark them for manual selection.
- [ ] Verify local asset paths load from Vite.
- [ ] Replace hotlinked URLs in current HTML/CSS with local paths.

### Build And Structure

- [x] Add `vite.config.js` multi-page input configuration.
- [x] Confirm `npm run build` emits all intended HTML pages.
- [ ] Move unused Vite starter files out of the active path or delete them after review.
- [x] Avoid importing the same CSS from JavaScript and linking it directly from HTML unless the build strategy requires it.
- [ ] Create `src/styles/tokens.css`.
- [ ] Create `src/styles/base.css`.
- [ ] Create `src/data/navigation.js`.
- [ ] Create `src/data/products.js`.
- [ ] Create `src/data/heroSections.js`.
- [ ] Move `menuData` from `main.js` into data module.
- [ ] Move inline login script out of `login.html`.
- [ ] Split or reorganize CSS after behavior is stable.
- [x] Add a clear local dev command note to project docs.

### Homepage

- [ ] Replace all homepage remote video/image URLs with local assets.
- [x] Fix favicon reference.
- [x] Tune header top/scroll contrast.
- [x] Verify all hero CTAs navigate correctly.
- [ ] Add fallback image for every video hero.
- [ ] Check hero media crop at `1440x1100`, `1280x900`, `768x1024`, `390x844`.
- [ ] Ensure no hero text overlaps with header or CTA rows.

### Mega Menu

- [x] Add robust null guards for menu DOM elements.
- [ ] Populate menu from shared navigation data.
- [ ] Implement desktop hover and mobile tap behavior.
- [ ] Add focus handling and Escape close.
- [x] Add body scroll lock that restores cleanly.
- [ ] Add local menu promo images.
- [ ] Verify submenu links and placeholder links.
- [ ] Confirm menu screenshot matches reference at desktop and mobile sizes.

### Product Pages

- [x] Normalize all prices and fix encoding issues.
- [ ] Replace all product images with local assets.
- [ ] Add shared product card markup or renderer.
- [ ] Add product data file.
- [x] Add consistent category headings.
- [x] Add a `480px` breakpoint or auto-fit grid rule so two-column mobile cards do not become cramped.
- [ ] Verify product grids on desktop/tablet/mobile.
- [x] Add hover states that do not shift layout.
- [ ] Decide whether product detail pages are out of scope for v1.

### Login Page

- [ ] Replace external right-side image with local harvested asset.
- [ ] Move login JS into a separate module.
- [ ] Replace alerts with inline local status messages.
- [ ] Add validation messaging for invalid email/password states.
- [ ] Add accessible labels and button states.
- [ ] Verify split-screen desktop and mobile single-column layouts.

### Visual Verification

- [x] Add `playwright.config.js`.
- [x] Add `tests/smoke.spec.js`.
- [x] Add `tests/visual.spec.js`.
- [x] Add `tests/accessibility.spec.js`.
- [x] Add `test:e2e`, `test:e2e:headed`, and `test:e2e:update` scripts to `package.json`.
- [x] Configure Playwright `webServer` for Vite.
- [x] Configure desktop and mobile Playwright projects.
- [x] Configure traces on retry and screenshot output.
- [ ] Create `scripts/visual-check.mjs`.
- [ ] Capture local screenshots for each target viewport.
- [ ] Compare local screenshots manually against reference captures.
- [x] Check console errors on every page.
- [ ] Check failed network requests on every page.
- [ ] Record network failures with URL, status, and resource type.
- [ ] Verify no visible page still depends on `www.prada.com` or another external image host after local asset replacement.
- [x] Check build output page list.
- [ ] Run Lighthouse-style manual pass for obvious performance issues.
- [ ] Check keyboard behavior for menu open/close and login controls.
- [x] Check accessible names for icon buttons and form inputs.
- [x] Check that shop logo/back icon links have accessible names.
- [x] Check that homepage has a valid page-level heading.
- [x] Check that focus is visible on all controls.
- [x] Check `prefers-reduced-motion` behavior.
- [ ] Keep a visual audit log in `docs/visual-audit.md`.

### Quality And Hygiene

- [x] Add `.gitignore` entries for raw large captures if needed.
- [x] Add `.gitignore` entries for Playwright screenshots, traces, and MCP artifacts if they should not be committed.
- [ ] Keep downloaded asset manifest deterministic.
- [ ] Document which assets are captured for private learning use only.
- [x] Avoid adding unrelated frameworks before the static clone is stable.
- [x] Keep changes scoped and testable page by page.

### Deployment Readiness

- [x] Verify `npm run build`.
- [x] Verify `npm run preview`.
- [x] Smoke test the preview server, not only Vite dev.
- [x] Confirm built `dist/` includes all target HTML pages.
- [x] Confirm no built page references `/vite.svg`.
- [x] Confirm no duplicate CSS loading remains.
- [x] Document expected generated artifacts and commands in `README.md`.

## Remaining Todo Spawn

The checklist above is the source of truth. This section groups the unfinished work into execution batches so the next implementation pass can start without re-triaging.

### Batch 1 - Build Baseline And Hygiene

- [x] Add `vite.config.js` with Rollup multi-page inputs for `index.html`, `women.html`, `men.html`, `new-arrivals.html`, and `login.html`.
- [x] Re-run `npm run build` and confirm all five HTML pages appear in `dist/`.
- [x] Replace the homepage `/vite.svg` favicon reference with `/favicon.svg`.
- [x] Remove duplicate homepage CSS loading by choosing either direct HTML link or JavaScript import.
- [x] Add `.gitignore` entries for `.playwright-mcp/`, `test-results/`, and large raw harvest folders if they should stay local.
- [x] Add or update `README.md` with local commands and generated artifact notes.

### Batch 2 - Playwright Test Harness

- [x] Add `playwright.config.js` with `webServer`, desktop/mobile projects, screenshot output, and traces on retry.
- [x] Add `test:e2e`, `test:e2e:headed`, and `test:e2e:update` scripts to `package.json`.
- [x] Add `tests/smoke.spec.js` for `/`, `/women.html`, `/men.html`, `/new-arrivals.html`, and `/login.html`.
- [ ] Tighten smoke tests to fail on all failed document/script/style/font/image/media requests, including external hotlinks after assets are local.
- [ ] Add initial accessibility checks for unnamed icon links, homepage heading strategy, visible focus, and mega menu controls.
- [x] Add initial screenshot checks for home, menu open, product grids, and login desktop/mobile.

### Batch 3 - Asset Harvester

- [x] Create `scripts/harvest-prada-assets.mjs`.
- [x] Create `public/assets/harvested/prada/raw/` and `public/assets/reference/prada/` folder structure.
- [ ] Capture selected Prada source pages with Playwright desktop and mobile viewports.
- [ ] Save images, videos, fonts, CSS, and selected public JSON with content-addressed filenames.
- [ ] Generate `public/assets/harvested/prada/manifest.json`.
- [x] Create a curated app-facing `public/assets/reference/prada/metadata/manifest.json`.
- [ ] Replace current hotlinked Prada/Zara media and font URLs with local manifest-backed paths.

### Batch 4 - Page Refactor

- [ ] Move login inline JavaScript into a page module.
- [x] Add null guards around homepage menu/header/hero JavaScript.
- [ ] Move mega menu data into `src/data/navigation.js`.
- [ ] Move product data into `src/data/products.js`.
- [ ] Move homepage hero data into `src/data/heroSections.js`.
- [ ] Extract shared product-card rendering for women, men, and new arrivals.
- [ ] Add CSS token/base files and reduce repeated font/reset/header rules.

### Batch 5 - UI Completion And Accessibility

- [ ] Replace all `href="#"` placeholders with real local routes, disabled states, or `aria-disabled`.
- [x] Convert mega menu category `<li>` interactions into keyboard-focusable controls.
- [x] Add `aria-expanded` on the menu button and basic overlay dialog semantics.
- [ ] Add full focus return/trap behavior for the mega menu overlay.
- [x] Add visible focus states where current CSS removes outlines.
- [x] Add `prefers-reduced-motion` handling for GSAP and transitions.
- [ ] Add video poster/fallback images for each homepage hero.
- [x] Add a `480px` or auto-fit product grid rule for small mobile screens.

### Batch 6 - Reference And Visual Audit

- [ ] Capture Prada.com reference screenshots for homepage, mega menu states, category pages, and login.
- [x] Capture live Prada reference for `https://www.prada.com/ww/en/womens/new-in/c/10111EU` and compare against local `new-arrivals.html`.
- [x] Capture live Prada reference for `https://www.prada.com/ww/en/mens/new-in/c/10182EU` and compare against local `men.html`.
- [ ] Create `docs/reference-notes.md`.
- [ ] Create `docs/visual-audit.md`.
- [ ] Capture local screenshots at `1440x1100`, `1280x900`, `768x1024`, and `390x844`.
- [ ] Compare reference and local screenshots manually.
- [x] Run `npm run preview` and smoke test preview, not only Vite dev.

## Verification Commands

```bash
npm run dev
npm run build
npm run preview
npx playwright --version
npx playwright test
node scripts/harvest-prada-assets.mjs
node scripts/capture-reference-screenshots.mjs
node scripts/visual-check.mjs
```

## Human Checkpoints

Call Sisi Human only for decisions that affect project direction:

- Whether to prioritize pixel closeness or clean maintainability when they conflict.
- Whether to keep real Prada assets locally or switch to legally safer substitutes before sharing.
- Whether to include product detail/cart/search pages in v1 scope.
- Whether very large video assets are acceptable in the local project folder.

No human decision is needed for routine implementation, asset organization, build setup, or visual verification.

## Definition Of Done For V1

- `npm run build` outputs all target pages.
- Homepage, mega menu, women, men, new arrivals, and login pages load with no console errors.
- Playwright smoke checks pass on desktop and mobile projects.
- All visible hero/product/login imagery is local, not hotlinked.
- Desktop and mobile screenshots exist for each target page.
- Header, mega menu, hero sections, product grids, and login form are visually close to the captured Prada references.
- The project remains understandable as a learning codebase, without unnecessary framework complexity.
