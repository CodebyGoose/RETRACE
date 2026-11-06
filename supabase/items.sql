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

insert into public.items (
  id, name, status, category, place, detail_place, date, time, image,
  hero_image, description, collection_point, hours
)
values
(
  'LF-2048', 'Black Herschel backpack', 'found', 'Bags & accessories',
  'Main Library', 'Main Library · Floor 2', '2026-10-19', '9:30 AM',
  '/images/backpack.png', '/images/backpack-large.png',
  'Black Herschel backpack with a brown leather patch and front zip pocket. Found beside a study desk on the second floor of the Main Library this morning.',
  'Main Library help desk', 'Monday–Friday · 8:00 AM–8:00 PM'
),
(
  'LF-2047', 'Sage green water bottle', 'lost', 'Personal items',
  'Sports Centre', 'Sports Centre · Courts entrance', '2026-10-19', '4:15 PM',
  '/images/bottle.png', null,
  'Insulated sage green water bottle with a handle loop. Last seen near the courts entrance after evening practice.',
  'Sports Centre front desk', 'Monday–Saturday · 7:00 AM–9:00 PM'
),
(
  'LF-2046', 'Keys with a blue lanyard', 'found', 'Keys & cards',
  'Student Union', 'Student Union · Ground floor', '2026-10-18', '1:10 PM',
  '/images/keys.png', null,
  'A small bunch of keys on a dark blue lanyard with a metal clip. Found on a table in the Student Union lounge.',
  'Student Union information desk', 'Monday–Friday · 8:00 AM–6:00 PM'
)
on conflict (id) do nothing;
