create table if not exists public.tutors (
  registry_id text primary key,
  name text not null,
  exam text not null,
  score text not null,
  category text not null check (category in ('ib', 'ap', 'alevel', 'sat', 'english')),
  tier text not null check (tier in ('premium', 'standard')),
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tutors enable row level security;

revoke insert, update, delete on table public.tutors from anon, authenticated;
grant select on table public.tutors to anon, authenticated;

drop policy if exists "Public can read active tutors" on public.tutors;
create policy "Public can read active tutors"
on public.tutors
for select
to anon, authenticated
using (active = true);

insert into public.tutors (
  registry_id,
  name,
  exam,
  score,
  category,
  tier,
  display_order,
  active
)
values
  ('P-001', '배이안', 'IB', '43/45', 'ib', 'premium', 1, true),
  ('P-002', '신승윤', 'A-Level', 'A*A*A*A*', 'alevel', 'premium', 2, true),
  ('P-003', '오병국', 'SAT', '1510', 'sat', 'premium', 3, true),
  ('S-001', '이윤재', 'IELTS', '8', 'english', 'standard', 4, true)
on conflict (registry_id) do update
set
  name = excluded.name,
  exam = excluded.exam,
  score = excluded.score,
  category = excluded.category,
  tier = excluded.tier,
  display_order = excluded.display_order,
  active = excluded.active,
  updated_at = now();
