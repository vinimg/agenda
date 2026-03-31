-- Agenda PWA – Supabase schema + RLS
-- Run this in the Supabase SQL editor (Dashboard → SQL editor → New query)

create extension if not exists "uuid-ossp";

-- ─── TASKS ────────────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references auth.users(id) on delete cascade not null,
  local_id          integer,
  title             text not null,
  description       text,
  status            text not null default 'todo',
  priority          text not null default 'medium',
  urgency           integer,
  difficulty        integer,
  due_date          date,
  due_time          time,
  scheduled_date    date,
  scheduled_time    time,
  estimated_minutes integer,
  location          text,
  tags              text[],
  color             text,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.tasks enable row level security;
create policy "tasks: own data only" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── HABITS ───────────────────────────────────────────────────────────────────
create table if not exists public.habits (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid references auth.users(id) on delete cascade not null,
  local_id               integer,
  parent_local_id        integer,
  title                  text not null,
  description            text,
  color                  text not null default '#7856ff',
  icon                   text,
  attribute              text,            -- strength|intelligence|discipline|wellness|social|creativity
  schedule               jsonb not null default '{}',
  location               text,
  start_date             date not null,
  end_date               date,
  is_active              boolean not null default true,
  current_streak         integer default 0,
  longest_streak         integer default 0,
  target_hours_per_day   numeric,
  target_hours_per_week  numeric,
  target_hours_per_month numeric,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.habits enable row level security;
create policy "habits: own data only" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── HABIT ENTRIES ────────────────────────────────────────────────────────────
create table if not exists public.habit_entries (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  local_id       integer,
  habit_local_id integer not null,
  date           date not null,
  status         text not null default 'completed',
  completed_at   timestamptz,
  notes          text,
  actual_minutes integer,
  created_at     timestamptz not null default now()
);

alter table public.habit_entries enable row level security;
create policy "habit_entries: own data only" on public.habit_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
