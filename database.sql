-- FAMILIEINDKØB: Supabase-skema med adgangskontrol pr. familie.
-- Kør HELE filen én gang i Supabase > SQL Editor > New query > Run.
-- Den er sikker at køre igen ved senere opdateringer.
-- Kræver Supabase Auth (email/password).

create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 100),
  invite_code text not null unique default lower(encode(gen_random_bytes(10), 'hex')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 1 and 100),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 120),
  status text not null default 'active' check (status in ('active','archived')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 140),
  quantity text not null default '' check (length(quantity) <= 60),
  category text not null default 'other' check (category in ('produce','dairy','meat','bread','pantry','frozen','drinks','household','other')),
  checked boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shopping_lists_household_idx on public.shopping_lists(household_id,status,created_at);
create index if not exists shopping_items_list_idx on public.shopping_items(list_id,position);
create index if not exists household_members_user_idx on public.household_members(user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shopping_lists_updated_at on public.shopping_lists;
create trigger shopping_lists_updated_at before update on public.shopping_lists
for each row execute function public.set_updated_at();
drop trigger if exists shopping_items_updated_at on public.shopping_items;
create trigger shopping_items_updated_at before update on public.shopping_items
for each row execute function public.set_updated_at();

-- Security-definer helper avoids recursive RLS checks on household_members.
create or replace function public.is_household_member(p_household_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.household_members m
    where m.household_id = p_household_id and m.user_id = auth.uid()
  );
$$;

-- Only these controlled functions may add users to a family.
create or replace function public.create_household(p_name text, p_display_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_household_id uuid;
  v_person text := coalesce(nullif(trim(p_display_name), ''), 'Familiemedlem');
begin
  if v_user is null then raise exception 'Du skal være logget ind'; end if;
  if coalesce(length(trim(p_name)),0) not between 1 and 100 then raise exception 'Ugyldigt familienavn'; end if;
  if length(v_person) > 100 then raise exception 'Navnet er for langt'; end if;

  insert into public.households(name,created_by)
  values(trim(p_name),v_user)
  returning id into v_household_id;

  insert into public.household_members(household_id,user_id,display_name)
  values(v_household_id,v_user,v_person);
  return v_household_id;
end;
$$;

create or replace function public.join_household(p_invite_code text, p_display_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_household_id uuid;
  v_person text := coalesce(nullif(trim(p_display_name), ''), 'Familiemedlem');
begin
  if v_user is null then raise exception 'Du skal være logget ind'; end if;
  if length(v_person) > 100 then raise exception 'Navnet er for langt'; end if;
  select h.id into v_household_id
  from public.households h
  where h.invite_code = lower(trim(p_invite_code));
  if v_household_id is null then raise exception 'Ukendt familiekode'; end if;

  insert into public.household_members(household_id,user_id,display_name)
  values(v_household_id,v_user,v_person)
  on conflict (household_id,user_id) do update set display_name=excluded.display_name;
  return v_household_id;
end;
$$;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_items enable row level security;

drop policy if exists "Members can see their families" on public.households;
create policy "Members can see their families" on public.households
for select to authenticated using (public.is_household_member(id));

drop policy if exists "Members can see family members" on public.household_members;
create policy "Members can see family members" on public.household_members
for select to authenticated using (public.is_household_member(household_id));

drop policy if exists "Members can read their lists" on public.shopping_lists;
create policy "Members can read their lists" on public.shopping_lists
for select to authenticated using (public.is_household_member(household_id));

drop policy if exists "Members can create lists" on public.shopping_lists;
create policy "Members can create lists" on public.shopping_lists
for insert to authenticated with check (public.is_household_member(household_id) and created_by = auth.uid());

drop policy if exists "Members can update their lists" on public.shopping_lists;
create policy "Members can update their lists" on public.shopping_lists
for update to authenticated using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "Members can delete their lists" on public.shopping_lists;
create policy "Members can delete their lists" on public.shopping_lists
for delete to authenticated using (public.is_household_member(household_id));

drop policy if exists "Members can read their items" on public.shopping_items;
create policy "Members can read their items" on public.shopping_items
for select to authenticated using (exists (
  select 1 from public.shopping_lists l where l.id = list_id
  and public.is_household_member(l.household_id)
));

drop policy if exists "Members can create items" on public.shopping_items;
create policy "Members can create items" on public.shopping_items
for insert to authenticated with check (exists (
  select 1 from public.shopping_lists l where l.id = list_id
  and l.status = 'active' and public.is_household_member(l.household_id)
));

drop policy if exists "Members can update items" on public.shopping_items;
create policy "Members can update items" on public.shopping_items
for update to authenticated using (exists (
  select 1 from public.shopping_lists l where l.id = list_id
  and l.status = 'active' and public.is_household_member(l.household_id)
)) with check (exists (
  select 1 from public.shopping_lists l where l.id = list_id
  and l.status = 'active' and public.is_household_member(l.household_id)
));

drop policy if exists "Members can delete items" on public.shopping_items;
create policy "Members can delete items" on public.shopping_items
for delete to authenticated using (exists (
  select 1 from public.shopping_lists l where l.id = list_id
  and l.status = 'active' and public.is_household_member(l.household_id)
));

-- Supabase normally supplies general table grants; these are explicit.
revoke all on public.households,public.household_members,public.shopping_lists,public.shopping_items from anon;
revoke all on public.households,public.household_members,public.shopping_lists,public.shopping_items from authenticated;
grant select on public.households,public.household_members to authenticated;
grant select,insert,delete on public.shopping_lists,public.shopping_items to authenticated;
grant update(name,status,archived_at) on public.shopping_lists to authenticated;
grant update(name,quantity,category,checked,position) on public.shopping_items to authenticated;

revoke all on function public.is_household_member(uuid) from public;
revoke all on function public.create_household(text,text) from public;
revoke all on function public.join_household(text,text) from public;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.create_household(text,text) to authenticated;
grant execute on function public.join_household(text,text) to authenticated;

-- Enable instant synchronization between open browsers. Avoid duplicate additions.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='shopping_lists') then
    alter publication supabase_realtime add table public.shopping_lists;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='shopping_items') then
    alter publication supabase_realtime add table public.shopping_items;
  end if;
end $$;
