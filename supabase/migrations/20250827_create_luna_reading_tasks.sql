create table if not exists public.luna_reading_tasks (
  task_id uuid primary key references public.teacher_assignments(id) on delete cascade,
  content jsonb not null,
  parameters jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_luna_reading_tasks_created_at on public.luna_reading_tasks (created_at desc);

do $$
begin
  if not exists (select 1 from pg_proc where proname = 'set_timestamp') then
    create or replace function public.set_timestamp()
    returns trigger as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$ language plpgsql;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_timestamp_luna_reading_tasks'
  ) then
    create trigger set_timestamp_luna_reading_tasks
    before update on public.luna_reading_tasks
    for each row execute function public.set_timestamp();
  end if;
end$$;

