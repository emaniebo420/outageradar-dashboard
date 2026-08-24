# OutageRadar dashboard — Phase 2

Live at **[outageradar-dashboard.vercel.app](https://outageradar-dashboard.vercel.app)**.

This is the read side of OutageRadar: a Next.js page that queries Supabase directly on every
request and shows the current status of every vendor the
[poller](https://github.com/emaniebo420/outageradar-poller) is tracking — no caching layer, so
it's never showing a stale "all good" during a real incident.

## How it reads data

The page connects to Supabase with the **publishable (anon) key**, which only has read access
enforced by row-level security — this project never ships a secret key to the browser. Every
vendor's current status lives in one table (`vendors`), written by the poller every 5 minutes.

## Running it locally

```bash
npm install
```

Create `.env.local` with:

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

Then:

```bash
npm run dev
```

**Note:** `dev` and `build` both run with `--webpack`. As of Tailwind CSS v4.3.x, the
Turbopack/Lightning CSS pipeline throws a parse error ("Invalid dangling combinator in selector")
on Tailwind's own generated `@layer` preamble — webpack remains a fully supported Next.js 16
bundler and sidesteps it entirely.

## Deploying

Deploys to Vercel via `vercel --prod`. `vercel.json`'s `buildCommand` pins the build to
`next build --webpack`, which overrides both the dashboard's own default and any conflicting
setting in the Vercel dashboard.

## Related

- [outageradar-poller](https://github.com/emaniebo420/outageradar-poller) — the Cloudflare
  Worker that polls vendor status pages every 5 minutes and sends email alerts when one changes.