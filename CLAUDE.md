# CLAUDE.md — menuviz.app (marketing site)

> Operational context for Claude Code. Read this first, every session.

## What this repo is

The **marketing/landing page** at [menuviz.app](https://menuviz.app) (+ `www`).
One page, one goal: book a demo. Static export (`next build` → `out/`),
deployed to **Cloudflare Pages** project `menuviz-web` by CI on pushes to
`main`. No database, no server runtime, no secrets in the app.

This repo is NOT the product — the diner app, admin panel, and QR service live
in sibling repos (see the org map below). Per-brand landing pages
(`ouii.menuviz.app/`) are part of the diner app, not this repo.

## The MenuViz org (which repo is which service)

Repos are named after the domain they serve. Local checkouts live side by side
in `~/menuviz-org/` (dir names predate the rename).

| GitHub repo         | Local dir        | Serves                           | Runs as                | Service                                                                             |
| ------------------- | ---------------- | -------------------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| `menuviz.app`       | `menuviz-web/`   | menuviz.app, www                 | CF Pages `menuviz-web` | **This repo** — marketing site (static)                                             |
| `_.menuviz.app`     | `menu-viz/`      | `<brand>.menuviz.app` (wildcard) | Worker `menu-viz`      | Diner app — brand landing at the subdomain root + 3D/AR branch menus at `/<branch>` |
| `admin.menuviz.app` | `menuviz-admin/` | admin.menuviz.app                | Worker `menuviz-admin` | Admin panel (private repo) — brands/branches/menus CRUD + 3D model uploads          |
| `qr.menuviz.app`    | `beacon-qr/`     | qr.menuviz.app                   | Worker `beacon-qr`     | Beacon — dynamic QR redirects + scan analytics                                      |
| `.github`           | `.github/`       | github.com/menuviz               | —                      | Org profile README                                                                  |

The `_.menuviz.app` repo also ships two extra workers: **menuviz-cdn**
(`workers/cdn/`, cdn.menuviz.app — serves the assets bucket with per-brand
hotlink rules; empty Referer always allowed for AR viewers) and **menuviz-og**
(`workers/og/` — renders each brand's static OpenGraph card to R2 at
`<brand>/brand/og.png` when branding changes).

### Shared infrastructure

- **Cloudflare**: account `09abb782bf38f116f993da799ee6e023`, zone menuviz.app
  `b2edc8a921ac1e85cfe3aa4cc3bb4e60`. Wildcard `*.menuviz.app` DNS + worker
  route → `menu-viz`; specific-host routes (`admin.`, `qr.`) take precedence;
  `cdn.menuviz.app` → worker `menuviz-cdn` serving R2 bucket `menuviz-assets`
  (3D models, brand-namespaced `/<brand>/models/...`; it allows empty-Referer
  fetches because AR viewers send none — never tighten that).
- **Supabase** project `nsqxweafdelhcrneptzc` (shared by diner + admin + qr):
  menu tables are anon-read / authenticated-write via RLS; beacon tables are
  service-key-only (RLS with no policies). This repo doesn't touch it.
- **Credentials**: Cloudflare API token in `menu-viz/.cf-token` (gitignored,
  **expires 2026-08-31 — rotate before then**). Each repo has
  `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` GitHub secrets;
  Supabase URL/anon key are repo _variables_ where needed.
- **Conventions (org-wide, locked)**: bun strictly (only `bun.lock`); nix dev
  shells are the source of truth (`nix develop`, machine has no global node);
  lefthook gates commits/pushes; CI deploys `main`, PRs get preview deploys.

- **Workers FREE plan** (confirmed 2026-07-06): limits don't bill, they
  BREAK — 100k requests/day account-wide (the CDN worker is the volume
  driver), ~10ms CPU/request (the "1102" failure class: never render images
  or batch heavy work per-request), KV 100k reads + 1k writes/day, Workers
  Logs 200k events/day. Workers Paid ($5/mo) lifts all of these and is the
  first upgrade when traffic grows.

## Where to start (this repo)

```bash
nix develop        # bun, node, treefmt, lefthook
bun install
bun run dev        # http://localhost:3000
```

Gates: `bun run lint`, `bun run type-check`, `bun run build` (static export).
CI (`.github/workflows/ci.yml`) deploys `out/` to Cloudflare Pages on `main`;
PRs get preview URLs commented. **The Pages project name is PINNED to
`menuviz-web` via `env.PAGES_PROJECT`** — it used to be derived from the repo
name, which broke the day the repo was renamed to `menuviz.app` (dots are not
valid in Pages project names). Don't "simplify" it back.

Key files: `app/page.tsx` (the page), `app/opengraph-image.tsx` (build-time OG
card — keep `dynamic = "force-static"`, required for static export),
`app/icon.svg` (**the canonical MenuViz mark** — QR brackets + Emerald Signal
`#2f9e6e`; the other three apps carry copies of this exact file, so favicon
changes start here and get re-copied), `DESIGN.md` / `PRODUCT.md` (visual +
product context — the OG cards and brand surfaces reuse this palette).
