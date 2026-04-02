-- Migration 002: unique identifier for github tasks to prevent duplicates
alter table public.tasks
  add column if not exists github_remote_id text unique;
