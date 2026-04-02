-- Migration 002: unique identifier for github tasks, scoped per user
alter table public.tasks
  add column if not exists github_remote_id text;

-- Drop global unique if it was created by mistake
alter table public.tasks drop constraint if exists tasks_github_remote_id_key;

-- Per-user unique index (partial, only for non-null values)
create unique index if not exists tasks_user_github_remote_id
  on public.tasks(user_id, github_remote_id)
  where github_remote_id is not null;
