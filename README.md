# Spark Stage Fashion Commerce — Skripsi Prototype

Dummy project skripsi berbasis visual clone Prada.com yang diarahkan menjadi Spark Stage fashion
commerce. Fokus: katalog fashion, cart, checkout DOKU sandbox, BOPIS pickup, dan admin CMS.

## Structure

```
prada-clone/
  frontend/       Vite SPA — React + TypeScript + React Router v7
  supabase/       Supabase config, migrations, Edge Functions
  docs/           Planning, skripsi context, styling guide
  package.json    npm workspaces entrypoint
```

## Stack

| Area | Stack |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router v7 |
| Styling | Custom CSS (global) + Tailwind v4 (admin/UI) |
| State | Zustand (UI), TanStack Query (server) |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Payment | DOKU Checkout sandbox |
| Fulfillment | BOPIS — buy online, pick up in store |
| Deploy | Vercel (frontend) + Supabase (backend) |

## Commands

```bash
# From repo root
npm run dev          # start dev server
npm run build        # production build (run before every deploy)
npm run typecheck    # TypeScript check
npm run test:e2e     # Playwright end-to-end tests

# From frontend/
npm run dev
npm run build
npm run typecheck
npm run test:e2e
```

## Before Deploying

Always run in this order:

```bash
npm run typecheck   # must exit 0
npm run build       # must exit 0 — this is the final CSS pipeline check
```

`npm run build` is the source of truth for CSS validity. A passing lint is not enough.
See `docs/styling-guide.md` for details.

## Routing

This is a single-page app. All routes are handled by React Router v7.

| URL | Page |
|---|---|
| `/` | Homepage |
| `/women` | Women shop |
| `/men` | Men new arrivals |
| `/new-arrivals` | Women new arrivals |
| `/product/:slug` | Product detail |
| `/login` | Login / Sign up |
| `/admin/:tab` | Admin CMS (admin role required) |

Legacy `.html` URLs redirect automatically (e.g. `/login.html` → `/login`).

## Styling Architecture

Hybrid approach — see `docs/styling-guide.md` for full rules.

Short version:
- **Custom CSS** (class-based) for visual pages — loaded via `<link>` in `index.html`
- **Tailwind v4** for admin and new UI components — entry via `src/styles/tailwind.css`
- **Never** import plain CSS files from JS/TSX components

## Supabase

Project: `backendsparkecommerce` (ref: `xyhdnprncjvhtdfyovpx`)

```bash
supabase migration list    # check migration status
supabase db push           # push new migrations to remote
supabase functions list    # list deployed edge functions
```

## Assets

Reference assets are in `frontend/public/assets/reference/` and also uploaded to Supabase Storage.
To re-upload: `node frontend/scripts/upload-assets-to-storage.mjs`

## Generated Artifacts

- `frontend/dist/` — production build output
- `frontend/test-results/` and `frontend/playwright-report/` — Playwright output
- `frontend/public/assets/harvested/` — raw harvested assets (gitignored)
