<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Base44 dev environment

### Stack
TanStack Start (SSR via Nitro) + Vite 8 + React 19, styled with Tailwind v4.
Supabase provides the database (`submissions`, `user_roles`), storage (`drawings`
bucket), and auth. Drizzle ORM is configured but the schema file is empty;
migrations live in `supabase/migrations/` and `drizzle/migrations/`.

### Running
`docker compose -f docker-compose.base44.yml up -d` — a single `web` service
(node:22-slim) bind-mounts the source, runs `npm install` then `vite dev` on
port 3000. The Vite dev server serves live unhashed source modules (SSR), so
edits hot-reload without image rebuilds. `node_modules` is a named volume so
installs persist across restarts.

### Environment / secrets
- `.env.base44-defaults` holds placeholder Supabase values so the app boots
  without credentials (static pages render; community features won't work).
- Real Supabase credentials are delivered via `/run/base44/app.env` (platform
  secrets) and override the placeholders. Required: `SUPABASE_URL`,
  `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. The Vite client also
  reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` (set in defaults).
- The Supabase project must have the migrations in `supabase/migrations/` applied
  for the community drawing-submission / gallery / admin features to work.

### Verifying it works
`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → 200, and the
HTML contains the "Munchxine!" / "TeriDayo" content. The homepage, portafolio,
sobre-mí, and contacto pages are static and need no Supabase. The comunidad
page queries Supabase (gallery + paint canvas submission) and needs real creds.

### Asset handling
Image assets use Lovable's `/__l5e/assets-v1/...` CDN paths (see
`src/assets/*.asset.json`). The `@lovable.dev/vite-tanstack-config` plugin
serves/proxies these at dev time; they are not stored locally in the repo.
