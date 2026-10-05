# Ketoklar

Astro 7, TypeScript og Tailwind 4 på Cloudflare Workers, med D1 og en separat publisher i `workers/publisher`.

## Lokal udvikling på Mac

Brug Node 24 (minimum 22.12.0) og npm. Installer fra lockfilerne:

```sh
npm ci
npm ci --prefix workers/publisher
npm run db:setup:local
npm run check
npm test
npm run build
npm run dev -- --background
```

Administrér serveren med `npm run astro -- dev status`, `npm run astro -- dev logs` og `npm run astro -- dev stop`.
Standardadressen er http://localhost:4321. Databasen oprettes lokalt under `.wrangler`; bootstrap er til en ny udviklingsdatabase og er ikke en komplet produktionskopi eller generel migrationsrunner.

`npm run check` genererer Cloudflare-typer og kontrollerer både Astro og publisher-TypeScript. Der er endnu ingen særskilt lint-konfiguration. `npm test` kører kun `*.test.mjs`, aldrig release- eller preview-scripts.

## Secrets og tjenester

Lokale secrets gemmes i ignorerede `.dev.vars`-filer; se `.dev.vars.example` og `workers/publisher/.dev.vars.example`. Publisheren har fået en separat lokal publish-secret. Rating-koden bruger allerede Turnstiles testnøgler på localhost. Produktion kræver Cloudflare-login/rettigheder samt de eksisterende secrets og bindings til D1, R2, Workers AI, email og Turnstile.

## Produktion og historiske filer

Push til `main` kan udløse publisher-deploy og D1-skema/seed via GitHub Actions. Kontrollér workflows og produktionsstatus før push. `tests/release-article-widgets.mjs` og scripts under `output/` kan ændre produktion og indgår ikke i tests.

`output/` og `workers/publisher/output/` er bevarede historiske release-, billed- og eksportartefakter, ignoreret af Git. Nogle henviser til gamle Windows-stier og må gennemgås før genbrug. `output/publisher-release-20260915/.git` refererer til en Windows-worktree.

En fuld backup fra før Mac-klargøringen ligger under `.local-backups/`, inklusive oprindelige secrets, databaser, dependencies og Git-data. Mappen er privat og ignoreret af Git. Bevar en separat kopi uden for denne Mac for beskyttelse mod disktab.

Astro-dokumentation: https://docs.astro.build/en/guides/typescript/
