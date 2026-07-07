create table if not exists public.bridges (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.culverts (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.bridges add column if not exists updated_at timestamptz not null default now();
alter table public.culverts add column if not exists updated_at timestamptz not null default now();

create index if not exists bridges_data_gin on public.bridges using gin (data);
create index if not exists culverts_data_gin on public.culverts using gin (data);

alter table public.bridges enable row level security;
alter table public.culverts enable row level security;

drop policy if exists "public read bridges" on public.bridges;
create policy "public read bridges"
on public.bridges for select
to anon, authenticated
using (true);

drop policy if exists "public read culverts" on public.culverts;
create policy "public read culverts"
on public.culverts for select
to anon, authenticated
using (true);

-- Do not enable anonymous writes on the public GitHub Pages app unless this is a
-- controlled internal deployment. For local editing, use the Express server that
-- writes to the Google Drive sync folder, or seed with SUPABASE_SERVICE_ROLE_KEY.

create or replace view public.bridge_inventory as
select
  id as bridge_number,
  data ->> 'BridgeName' as bridge_name,
  data ->> 'RoadDescrPrincipal' as road_name,
  data ->> 'LinkID' as link_id,
  data ->> 'Region' as region,
  data ->> 'Station' as station,
  data ->> 'RoadClass' as road_class,
  nullif(data #>> '{Traffic,aadt_2026}', '')::numeric as aadt_2026,
  data
from public.bridges;
