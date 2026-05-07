-- Beulah Dashboard schema
-- Run this once in your Supabase project's SQL editor.

-- Leads: one row per prospective customer
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  company text,
  email text,
  phone text,
  stage text not null default 'Lead'
    check (stage in ('Lead','Contacted','Proposal','Negotiating','Signed')),
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists leads_owner_idx on leads(owner_id);
create index if not exists leads_stage_idx on leads(stage);

-- Activity log: timestamped entries from the bottom log bar (and future Gmail import)
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade not null,
  owner_id uuid references auth.users(id) on delete cascade not null,
  kind text not null default 'note'
    check (kind in ('note','email','call','meeting')),
  body text not null,
  event_at timestamptz default now() not null,
  created_at timestamptz default now()
);

-- Idempotent for upgrades from earlier versions:
alter table activity_log add column if not exists event_at timestamptz default now() not null;

create index if not exists activity_lead_event_idx on activity_log(lead_id, event_at desc);

-- Todos: outstanding tasks per lead. lead_id is NULL for "master todos"
-- (team-wide standing tasks like "Call each lead and report progress").
create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade not null,
  body text not null,
  done boolean default false,
  due_at timestamptz,
  created_at timestamptz default now()
);

-- Idempotent for upgrades from earlier versions:
alter table todos alter column lead_id drop not null;
alter table todos add column if not exists due_at timestamptz;
alter table todos add column if not exists position bigint default 0;
update todos set position = extract(epoch from created_at)::bigint where position = 0;
alter table todos add column if not exists details text;

create index if not exists todos_lead_idx on todos(lead_id, done, created_at);

-- Row-Level Security: each user only sees their own rows
alter table leads enable row level security;
alter table activity_log enable row level security;
alter table todos enable row level security;

-- Team mode: every authenticated user sees and edits all rows.
-- Switch back to per-user isolation by replacing these with the commented policies below.
drop policy if exists "own leads" on leads;
drop policy if exists "own activity" on activity_log;
drop policy if exists "own todos" on todos;
drop policy if exists "team leads" on leads;
drop policy if exists "team activity" on activity_log;
drop policy if exists "team todos" on todos;

create policy "team leads" on leads
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "team activity" on activity_log
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "team todos" on todos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Per-user isolation (alternative — uncomment to revert):
-- create policy "own leads" on leads
--   for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
-- create policy "own activity" on activity_log
--   for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
-- create policy "own todos" on todos
--   for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Attachments: files attached to a task or lead. The actual blobs live in
-- Supabase Storage bucket "attachments"; this table stores metadata.
create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  todo_id uuid references todos(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  path text not null,
  mime text,
  size bigint,
  created_at timestamptz default now()
);

create index if not exists attachments_todo_idx on attachments(todo_id);
create index if not exists attachments_lead_idx on attachments(lead_id);

alter table attachments enable row level security;
drop policy if exists "team attachments" on attachments;
create policy "team attachments" on attachments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Storage bucket + policies (private bucket; signed URLs for downloads)
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists "team attachments storage" on storage.objects;
create policy "team attachments storage" on storage.objects
  for all using (bucket_id = 'attachments' and auth.role() = 'authenticated')
  with check (bucket_id = 'attachments' and auth.role() = 'authenticated');

-- Profiles: a public-readable mirror of auth.users so the dashboard can show
-- "by Adam" / "by Sarah" badges next to leads, activities and todos.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
drop policy if exists "team profiles" on profiles;
create policy "team profiles" on profiles
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Trigger keeps profiles in sync with auth.users (insert + email change).
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute function handle_new_user();

-- Backfill rows for users who already exist before this trigger was added.
insert into profiles (id, email, display_name)
select id, email, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;
