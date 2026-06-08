# Uganda BMS Dashboard

React/Vite dashboard for the Ministry of Works and Transport bridge and major culvert inventory.

## Data Architecture

The app now supports three data modes:

- Static JSON fallback from `public/data`, which keeps GitHub Pages fast and reliable.
- Supabase/PostgreSQL through the REST endpoint at `https://udionwmqmjcfzbdhoetv.supabase.co/rest/v1`.
- A local Express companion server that writes JSON updates directly to the Google Drive synced folder at `G:\My Drive\MOWT\Bridge stuff\uganda_bms_data`.

GitHub Pages remains static. It cannot run Express, so public hosting reads from Supabase where available and falls back to bundled JSON. Local editing can run the Express server beside Vite.

## Commands

```bash
npm run dev
npm run dev:full
npm run build
npm run seed:supabase
```

`npm run dev:full` starts both the React app and the local Express backend from `server/bridgeSyncServer.cjs`.

The Express backend can also be started directly:

```bash
npm run server
```

Health check:

```bash
curl http://localhost:3001/api/health
```

## Supabase Setup

Apply `supabase/schema.sql` in the Supabase SQL editor. It creates the `bridges` and `culverts` tables as PostgreSQL `jsonb` records with public read policies.

To seed the corrected JSON inventory:

```bash
set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
npm run seed:supabase
```

The anonymous browser key is safe for public reads when Row Level Security is configured, but it should not be used for public writes. If a controlled internal deployment really needs anonymous browser writes, apply `supabase/anon-write-policy.local-only.sql` deliberately.

## Environment

Copy `.env.example` to `.env.local` to override defaults during local development.

Important variables:

- `VITE_SUPABASE_REST_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_BMS_DATA_SOURCE`: `auto` or `static`
- `VITE_LOCAL_BMS_API`
- `SUPABASE_SERVICE_ROLE_KEY` for seeding only
