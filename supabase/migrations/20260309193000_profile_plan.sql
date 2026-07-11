alter table public.profiles
add column if not exists plan text not null default 'free'
check (plan in ('free', 'plus'));

update public.profiles
set plan = 'free'
where plan is null;
