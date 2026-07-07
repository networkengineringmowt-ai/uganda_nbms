-- Optional local/internal policy.
-- Do not apply this to a public production database unless you intend any holder
-- of the browser anon key to be able to edit the BMS inventory.

drop policy if exists "anon insert bridges" on public.bridges;
create policy "anon insert bridges"
on public.bridges for insert
to anon
with check (true);

drop policy if exists "anon update bridges" on public.bridges;
create policy "anon update bridges"
on public.bridges for update
to anon
using (true)
with check (true);

drop policy if exists "anon insert culverts" on public.culverts;
create policy "anon insert culverts"
on public.culverts for insert
to anon
with check (true);

drop policy if exists "anon update culverts" on public.culverts;
create policy "anon update culverts"
on public.culverts for update
to anon
using (true)
with check (true);
