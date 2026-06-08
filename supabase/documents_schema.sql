create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  file_type text not null,
  snippet text,
  size_mb numeric,
  storage_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.document_photos (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  filename text not null,
  storage_url text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.documents enable row level security;
alter table public.document_photos enable row level security;

drop policy if exists "public read documents" on public.documents;
create policy "public read documents"
on public.documents for select
to anon, authenticated
using (true);

drop policy if exists "public read document_photos" on public.document_photos;
create policy "public read document_photos"
on public.document_photos for select
to anon, authenticated
using (true);

-- Create Storage Buckets and Policies
insert into storage.buckets (id, name, public) values ('documents', 'documents', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict do nothing;

drop policy if exists "Public Access Documents" on storage.objects;
create policy "Public Access Documents"
on storage.objects for select
to public
using (bucket_id = 'documents');

drop policy if exists "Public Access Photos" on storage.objects;
create policy "Public Access Photos"
on storage.objects for select
to public
using (bucket_id = 'photos');
