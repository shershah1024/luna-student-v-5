-- Create luna_listening_tasks table to store combined listening quiz data
-- Links to teacher_assignments(id) as task_id (UUID)

create table if not exists public.luna_listening_tasks (
  task_id uuid primary key references public.teacher_assignments(id) on delete cascade,
  content jsonb not null,
  audio_url text,
  transcript text,
  parameters jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_luna_listening_tasks_created_at on public.luna_listening_tasks (created_at desc);

-- Trigger to auto-update updated_at
create or replace function public.set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_timestamp_luna_listening_tasks'
  ) then
    create trigger set_timestamp_luna_listening_tasks
    before update on public.luna_listening_tasks
    for each row execute function public.set_timestamp();
  end if;
end$$;

