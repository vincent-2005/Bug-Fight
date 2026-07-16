-- Run this entire file in Supabase Dashboard → SQL Editor → New query.
-- It creates shared player profiles for the Bug Brawler leaderboard.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 16),
  money integer not null default 0 check (money >= 0),
  weapon_level integer not null default 0 check (weapon_level >= 0),
  armor_level integer not null default 0 check (armor_level >= 0),
  levels_survived integer not null default 0 check (levels_survived >= 0),
  tutorial_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Authenticated players can view the leaderboard"
on public.profiles for select to authenticated using (true);

create policy "Players can update their own profile"
on public.profiles for update to authenticated using (auth.uid() = id)
with check (auth.uid() = id);

create function public.create_player_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_player_profile();
