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
  created_at timestamptz default now()
);

create index if not exists activity_lead_idx on activity_log(lead_id, created_at desc);

-- Todos: outstanding tasks per lead
create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade not null,
  owner_id uuid references auth.users(id) on delete cascade not null,
  body text not null,
  done boolean default false,
  created_at timestamptz default now()
);

create index if not exists todos_lead_idx on todos(lead_id, done, created_at);

-- Row-Level Security: each user only sees their own rows
alter table leads enable row level security;
alter table activity_log enable row level security;
alter table todos enable row level security;

drop policy if exists "own leads" on leads;
drop policy if exists "own activity" on activity_log;
drop policy if exists "own todos" on todos;

create policy "own leads" on leads
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own activity" on activity_log
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own todos" on todos
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
