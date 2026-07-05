# menuviz-web

The marketing site for [menuviz.app](https://menuviz.app) — a single page whose
only goal is getting restaurant decision-makers to book a demo. See `PRODUCT.md`
for the brief and `DESIGN.md` for the design system.

## Development

The dev environment is nix-first; the flake pins bun, node, and the formatting
toolchain. Entering the shell also installs the git hooks (lefthook).

```bash
nix develop        # or: nix-shell
bun install
bun run dev        # http://localhost:3000
```

Quality gates (also run by lefthook on commit/push and by CI):

```bash
bun run lint         # eslint
bun run type-check   # tsc --noEmit
bun run format       # treefmt (prettier + nixfmt)
bun run build        # static export → out/
```

## Deployment

`next build` emits a fully static export (`out/`), deployed to **Cloudflare
Pages** by `.github/workflows/ci.yml`:

- Push to `main` → lint, type-check, build → production deploy.
- Pull request → same checks → preview deploy, URL commented on the PR.

Required repo secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
Optional: `GH_ADMIN_TOKEN` (sets the repo homepage to the deployment URL).
