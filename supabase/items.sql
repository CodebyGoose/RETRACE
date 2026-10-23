create table if not exists public.items (
  id text primary key,
  name text not null,
  status text not null check (status in ('found', 'lost')),
  category text not null,
  place text not null,
  detail_place text,
  date date not null default current_date,
  time text,
  image text,
  hero_image text,
  description text,
  collection_point text,
  hours text,
  created_at timestamptz not null default now()
);

alter table public.items enable row level security;

drop policy if exists "Anyone can view items" on public.items;
create policy "Anyone can view items"
on public.items for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can create items" on public.items;
create policy "Authenticated users can create items"
on public.items for insert
to authenticated
with check (true);
