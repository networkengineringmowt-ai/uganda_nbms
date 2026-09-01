-- ============================================================
-- NBMS (National Bridge Management System) live database schema
-- ============================================================
-- Run this once in the Supabase SQL editor for the project you want
-- uganda_nbms to read from. It only CREATEs new tables (nbms_bridges,
-- nbms_culverts, nbms_bridge_works) -- it does not touch any existing
-- tables from your other platforms (road_links, bridges, culverts, etc.),
-- so it is safe to run against the same project that already powers
-- uganda-roads.
--
-- Each table keeps the full original record as a `raw` jsonb column (so
-- nothing from the source Excel/legacy exports is lost or has to be
-- re-mapped column by column) plus a handful of named columns for fast
-- filtering and indexing. The site reads `raw` and runs it through the
-- exact same normalize() functions it already uses for the bundled JSON
-- files, so the two data sources are interchangeable from the app's point
-- of view.
--
-- Security model matches your existing supabase_enable_rls.sql /
-- supabase_secure_grants.sql pattern: RLS on, public (anon) SELECT-only,
-- no INSERT/UPDATE/DELETE from the public key. Writes are not part of this
-- migration -- they stay on your existing Local Drive / capture-server path.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- Bridges
-- ---------------------------------------------------------------
create table if not exists nbms_bridges (
  id uuid primary key default gen_random_uuid(),
  bridge_no text unique not null,
  bridge_name text,
  region text,
  station text,
  road_class text,
  link_no text,
  km double precision,
  overall_rating numeric,
  overall_condition text,
  lat double precision,
  lon double precision,
  raw jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists nbms_bridges_region_idx on nbms_bridges (region);
create index if not exists nbms_bridges_station_idx on nbms_bridges (station);
create index if not exists nbms_bridges_rating_idx on nbms_bridges (overall_rating);

alter table nbms_bridges enable row level security;

drop policy if exists "nbms_bridges_public_read" on nbms_bridges;
create policy "nbms_bridges_public_read"
  on nbms_bridges for select
  to anon
  using (true);

revoke insert, update, delete on nbms_bridges from anon;
grant select on nbms_bridges to anon;

-- ---------------------------------------------------------------
-- Culverts
-- ---------------------------------------------------------------
create table if not exists nbms_culverts (
  id uuid primary key default gen_random_uuid(),
  culvert_number text unique not null,
  region text,
  station text,
  road_class text,
  link_id text,
  overall_rating numeric,
  overall_condition text,
  lat double precision,
  lon double precision,
  raw jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists nbms_culverts_region_idx on nbms_culverts (region);
create index if not exists nbms_culverts_station_idx on nbms_culverts (station);
create index if not exists nbms_culverts_rating_idx on nbms_culverts (overall_rating);

alter table nbms_culverts enable row level security;

drop policy if exists "nbms_culverts_public_read" on nbms_culverts;
create policy "nbms_culverts_public_read"
  on nbms_culverts for select
  to anon
  using (true);

revoke insert, update, delete on nbms_culverts from anon;
grant select on nbms_culverts to anon;

-- ---------------------------------------------------------------
-- Bridge works (active contracts) -- small table, 14 rows today
-- ---------------------------------------------------------------
create table if not exists nbms_bridge_works (
  id uuid primary key default gen_random_uuid(),
  bridge text,
  raw jsonb not null,
  updated_at timestamptz not null default now()
);

alter table nbms_bridge_works enable row level security;

drop policy if exists "nbms_bridge_works_public_read" on nbms_bridge_works;
create policy "nbms_bridge_works_public_read"
  on nbms_bridge_works for select
  to anon
  using (true);

revoke insert, update, delete on nbms_bridge_works from anon;
grant select on nbms_bridge_works to anon;
