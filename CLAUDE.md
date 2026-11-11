# ClockMeister — project log

## What this is
Website for ClockMeister, a 3D-printed mechanical pendulum clock (~$350; deadbeat escapement, four-wheel train, spring-driven, exposed mechanism). Customers configure filament colors per part zone in a 3D view and buy via Stripe Checkout.

Design: Bauhaus / Mondrian (strong grid, black rules, off-white ground, deliberate primary colors, geometric type, subtle mechanical motion). Not template-looking.

Constraints: no database, no accounts, no server to maintain.

## How we work
The owner is learning web development through this project (background: data analytics). Claude writes code and runs commands, but explains every step in plain language before and after, and pauses at stage checkpoints for "next". Keep files small and readable. Teach git at each commit. Confirm before pushing to GitHub.

## Stack
- Next.js (App Router) + TypeScript, plain CSS (CSS Modules), no Tailwind
- react-three-fiber for the 3D configurator (Stage 5)
- Vercel hosting (Stage 7)
- Stripe Checkout + one serverless function that sets price and validates colors (Stage 8)
- Filament colors in `data/filaments.json` (Stage 6)

## Structure
- `app/layout.tsx` — root layout wrapping every page; site title/description
- `app/page.tsx` — home page (`/`)
- `app/globals.css` — site-wide styles
- `public/` — static files served as-is (images, models)
- `package.json` — dependencies and npm scripts
- `.gitignore` — includes `.env*` so secrets are never committed

## Roadmap
1. ✅ Tools and repo (Node v25, npm, git; repo cloned to ~/clock-website)
2. ✅ Next.js skeleton, README, CLAUDE.md, first commit
3. Design system + hero
4. Content sections (how it works, specs, FAQ, shipping)
5. 3D placeholder clock
6. Configurator (filaments.json, per-zone colors, live price)
7. Deploy to Vercel
8. Stripe Checkout + serverless function + success page
9. Real GLB from Onshape, map part names to zones
10. Polish and launch

## Routine tasks
- Run locally: `npm run dev` → http://localhost:3000
- Check the production build: `npm run build`
- Lint: `npm run lint`

## Notes
- Commit author is set per-repo: kcdavs / GitHub noreply address.
- `npm audit` reports 7 moderate issues in dev-only tooling (eslint's dependencies); not shipped to the site.
