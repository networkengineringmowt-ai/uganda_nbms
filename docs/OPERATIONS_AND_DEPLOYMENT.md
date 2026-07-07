# Operations and Deployment Runbook

## 1. Environments

| Environment | Purpose | Data behavior |
| --- | --- | --- |
| Vite development | Frontend development | Supabase with static fallback |
| Full local development | Data-entry workstation | Frontend plus Express/Google Drive writer |
| Vite preview | Production-build verification | Serves `dist` locally |
| GitHub Pages | Public static application | Supabase reads with static fallback; no trusted server runtime |

## 2. Prerequisites

- Node.js 20 or later.
- npm.
- Git.
- Repository access for deployment.
- Optional Supabase service-role key for controlled seeding.
- Optional Google Drive-synchronised directory for local data-entry writes.

## 3. Environment Configuration

Copy `.env.example` to `.env.local`.

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_REST_URL` | Browser PostgREST endpoint |
| `VITE_SUPABASE_ANON_KEY` | Browser anonymous key |
| `VITE_BMS_DATA_SOURCE` | `auto` or `static` |
| `VITE_LOCAL_BMS_API` | Local companion API URL |
| `SUPABASE_REST_URL` | Node seeding endpoint |
| `SUPABASE_ANON_KEY` | Optional Node anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged seeding key; never expose to the browser |
| `BMS_SYNC_DIR` | Local Express JSON sync directory |
| `BMS_FRONTEND_DATA_DIR` | Optional bundled-data source directory |

## 4. Local Operation

### Frontend only

```bash
npm ci
npm run dev
```

### Frontend and local writer

```bash
npm run dev:full
```

Verify the local writer:

```bash
curl http://localhost:3001/api/health
```

The health response should show `ok: true` and existing bridge and culvert paths.

## 5. Database Setup

Apply in Supabase SQL editor:

1. `supabase/schema.sql`
2. `supabase/documents_schema.sql`, if document tables and buckets are required

The default core schema enables anonymous reads and denies anonymous writes.

For a controlled internal environment only, `supabase/anon-write-policy.local-only.sql` enables anonymous upserts. Do not apply it to an unrestricted public production database.

### Seed data

PowerShell:

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
npm run seed:supabase
```

The seeder validates duplicate IDs, uploads bridge and culvert records in chunks, and prints final row counts.

## 6. Release Checklist

Before every public release:

1. Review `git status` and preserve unrelated local work.
2. Validate core JSON files and record counts.
3. Run lint.
4. Run the production Pages build.
5. Preview the build locally.
6. Verify role access and the main workflows.
7. Verify the map, structure selection, and evidence-photo resolution.
8. Deploy.
9. Verify the live HTML and main workspaces.

Commands:

```bash
npm run lint
npm run build:pages
npm run preview -- --host 127.0.0.1 --port 4173
```

## 7. Pages Build

```bash
npm run build:pages
```

This runs:

1. `vite build`
2. `scripts/prunePagesGallery.mjs`

The pruning step removes the large local evidence-photo directory and extracted offline files from `dist`. Production evidence photos resolve through `src/utils/photoUrlResolver.js`.

Confirm the Pages artifact is reasonably sized:

```powershell
$bytes = (Get-ChildItem dist -Recurse -File | Measure-Object Length -Sum).Sum
[math]::Round($bytes / 1MB, 1)
```

## 8. Deployment Methods

### Preferred: GitHub Actions

Push a reviewed source commit to `main`. `.github/workflows/deploy.yml`:

1. Installs dependencies with `npm ci`.
2. Runs `npm run build:pages`.
3. Uploads the Pages artifact.
4. Deploys with GitHub Pages Actions.

### Direct deployment

```bash
npm run deploy
```

The direct deployment script:

1. Rebuilds the Pages artifact.
2. Creates a temporary Git repository inside `dist`.
3. Commits the prepared static output.
4. Force-pushes it to the remote `gh-pages` branch.

Because it force-pushes `gh-pages`, use it only when the branch is dedicated to generated output.

## 9. Live Verification

Live URL:

<https://priscananjehe1996.github.io/uganda_bms/>

Verify:

- HTTP status is `200`.
- Page title is correct.
- Current hashed JS and CSS assets load.
- The role-access screen appears.
- Dashboard user opens Overview, GIS Map, Inventory, Maintenance, Analytics, Reports, and Photos.
- Data-entry user opens all four capture workspaces.
- Admin opens system tools.
- Structure counts are populated.
- Map canvas and markers render.
- The Photos workspace reports the complete indexed-photo count and supports grid and table views.
- Structure detail and all evidence photos for a known structure load.

GitHub Pages can take several minutes to update after a deployment. Hashed asset names are the most reliable way to confirm a new release.

## 10. Rollback

### GitHub Actions deployment

Revert the source commit on `main`, then allow the workflow to deploy the reverted build.

### Direct `gh-pages` deployment

Build and deploy the last known-good source revision, or force-push a known-good generated `gh-pages` commit.

Do not use destructive commands against a working directory containing uncommitted source or data changes.

## 11. Backup and Recovery

Before bulk updates:

- Back up bridge and culvert JSON.
- Export Supabase tables.
- Retain the source documents used for updates.
- Retain evidence photos and the gallery index.
- Record data-generation script versions and parameters.

For local companion-server writes, ensure the Google Drive sync directory has version history and is fully synchronised before and after a session.

## 12. Common Failures

| Failure | Cause | Response |
| --- | --- | --- |
| `npm run build` fails | Invalid import, syntax, or dependency mismatch | Fix the first build error, then rerun lint and build |
| Public build is too large | Photos or extracted data remained in `dist` | Use `npm run build:pages` and inspect artifact size |
| Saves fail on public site | Anonymous writes are intentionally denied | Use secured auth/API or local companion server |
| Supabase reads fail | Endpoint/key/network issue | App should fall back to static JSON; verify environment and RLS |
| Map is blank | Tile/network failure or container sizing issue | Verify network, map canvas, and layout height |
| Photos fail in production | Raw GitHub source missing or rate-limited | Verify filename/index/main-branch file and consider object storage |
| Live page remains old | Pages job pending or browser cache | Check deployment status and compare hashed asset names |
