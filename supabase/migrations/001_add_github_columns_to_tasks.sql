-- Migration 001: add GitHub integration columns to tasks
-- Run in Supabase SQL editor if schema.sql was applied before this change.

alter table public.tasks
  add column if not exists source            text not null default 'manual',
  add column if not exists github_repo       text,
  add column if not exists github_number     integer,
  add column if not exists github_type       text,
  add column if not exists queued_for_claude boolean not null default false,
  add column if not exists preferred_model   text not null default 'claude';
