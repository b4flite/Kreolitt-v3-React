-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Enums (Idempotent)
do $$ begin
    create type user_role as enum ('ADMIN', 'MANAGER', 'CLIENT');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type booking_status as enum ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type service_type as enum ('TRANSFER', 'TOUR', 'CHARTER');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type expense_category as enum ('FUEL', 'MAINTENANCE', 'SALARY', 'MARKETING', 'OFFICE', 'LICENSES', 'OTHER');
exception
    when duplicate_object then null;
end $$;

-- 3. PROFILES (Linked to Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  phone text,
  role user_role default 'CLIENT',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Migrations for Profile
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists company text;
alter table public.profiles add column if not exists nationality text;
alter table public.profiles add column if not exists vat_number text;

-- 4. BOOKINGS
create table if not exists public.bookings (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.profiles(id) on delete set null,
  client_name text not null,
  email text,
  phone text,
  service_type service_type not null,
  pickup_location text not null,
  dropoff_location text not null,
  pickup_time timestamp with time zone not null,
  pax integer not null default 1,
  status booking_status default 'PENDING',
  amount decimal(10, 2) default 0,
  currency text default 'SCR',
  notes text,
  history jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Performance Index for Email Lookups (Smart Linking)
create index if not exists bookings_email_idx on public.bookings(email);
create index if not exists bookings_client_id_idx on public.bookings(client_id);

-- 5. INVOICES
create table if not exists public.invoices (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references public.bookings(id) on delete set null,
  client_name text,
  client_address text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  subtotal decimal(10, 2) not null,
  tax_amount decimal(10, 2) not null,
  total decimal(10, 2) not null,
  paid boolean default false,
  currency text default 'SCR',
  items jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. EXPENSES
create table if not exists public.expenses (
  id uuid default uuid_generate_v4() primary key,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  category expense_category not null,
  description text not null,
  amount decimal(10, 2) not null,
  currency text default 'SCR',
  vat_included boolean default false,
  vat_amount decimal(10, 2) default 0,
  booking_id uuid references public.bookings(id) on delete set null,
  reference text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. SETTINGS & CMS
create table if not exists public.business_settings (
  id integer primary key default 1,
  name text default 'Kreol Island Tours',
  tagline text,
  email text,
  phone text,
  address text,
  about text,
  hero_image_url text,
  logo_url text,
  login_hero_image_url text,
  login_title text,
  login_message text,
  show_vat_breakdown boolean default true,
  vat_rate decimal(10, 4) default 0.15,
  eur_rate decimal(10, 4) default 15.2,
  usd_rate decimal(10, 4) default 14.1,
  default_transfer_price decimal(10, 2) default 1200, -- Audit Fix
  default_tour_price decimal(10, 2) default 3000,     -- Audit Fix
  auto_create_invoice boolean default false,
  enable_email_notifications boolean default true,
  payment_instructions text,
  bank_name text,
  account_number text,
  swift_code text,
  account_holder text,
  constraint single_row check (id = 1)
);

-- MIGRATIONS SECTION: Apply updates to existing tables safely
-- Settings Migrations
alter table public.business_settings add column if not exists login_hero_image_url text;
alter table public.business_settings add column if not exists login_title text;
alter table public.business_settings add column if not exists login_message text;
alter table public.business_settings add column if not exists show_vat_breakdown boolean default true;
alter table public.business_settings add column if not exists vat_rate decimal(10, 4) default 0.15;
alter table public.business_settings add column if not exists eur_rate decimal(10, 4) default 15.2; 
alter table public.business_settings add column if not exists usd_rate decimal(10, 4) default 14.1;
alter table public.business_settings add column if not exists bank_name text;
alter table public.business_settings add column if not exists account_number text;
alter table public.business_settings add column if not exists swift_code text;
alter table public.business_settings add column if not exists account_holder text;
alter table public.business_settings add column if not exists default_transfer_price decimal(10, 2) default 1200;
alter table public.business_settings add column if not exists default_tour_price decimal(10, 2) default 3000;
alter table public.business_settings add column if not exists auto_create_invoice boolean default false;
alter table public.business_settings add column if not exists enable_email_notifications boolean default true;
alter table public.business_settings add column if not exists payment_instructions text;

insert into public.business_settings (id) values (1) on conflict do nothing;

-- Bookings Migrations
alter table public.bookings add column if not exists phone text;
alter table public.bookings add column if not exists currency text default 'SCR';

-- Invoices Migrations
alter table public.invoices add column if not exists items jsonb default '[]'::jsonb;
alter table public.invoices add column if not exists currency text default 'SCR';
alter table public.invoices add column if not exists client_address text;

-- Expenses Migrations
alter table public.expenses add column if not exists currency text default 'SCR';
alter table public.expenses add column if not exists vat_included boolean default false;
alter table public.expenses add column if not exists vat_amount decimal(10, 2) default 0;
alter table public.expenses add column if not exists booking_id uuid references public.bookings(id) on delete set null;
alter table public.expenses add column if not exists reference text;

-- Adverts and Gallery
create table if not exists public.adverts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  image_url text not null,
  price text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.gallery (
  id uuid default uuid_generate_v4() primary key,
  image_url text not null,
  caption text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Services Content Table
create table if not exists public.services (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  icon text not null,
  price text,
  show_price boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed default services if empty
insert into public.services (title, description, icon)
select 'Airport Transfers', 'Reliable and comfortable transfers between Seychelles International Airport and your hotel or resort.', 'PaperAirplaneIcon'
where not exists (select 1 from public.services);

insert into public.services (title, description, icon)
select 'Island Tours', 'Discover the hidden gems of Mahe and Praslin with our guided tours tailored to your interests.', 'MapIcon'
where not exists (select 1 from public.services where title = 'Island Tours');

insert into public.services (title, description, icon)
select 'Private Charters', 'Exclusive boat and land charters for a truly personalized and luxury experience in paradise.', 'StarIcon'
where not exists (select 1 from public.services where title = 'Private Charters');

-- Migration for services (Safe Add)
alter table public.services add column if not exists price text;
alter table public.services add column if not exists show_price boolean default false;


-- 8. RLS POLICIES

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.invoices enable row level security;
alter table public.expenses enable row level security;
alter table public.business_settings enable row level security;
alter table public.adverts enable row level security;
alter table public.gallery enable row level security;
alter table public.services enable row level security;

-- Functions for Role Checking
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
end;
$$ language plpgsql security definer;

create or replace function public.is_staff()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('ADMIN', 'MANAGER')
  );
end;
$$ language plpgsql security definer;

-- Profiles Policies
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can update all profiles" on public.profiles for update using (is_admin());

-- Bookings Policies
drop policy if exists "Staff can view all bookings" on public.bookings;
drop policy if exists "Staff can update all bookings" on public.bookings;
drop policy if exists "Staff can delete bookings" on public.bookings;
drop policy if exists "Clients can view own bookings" on public.bookings;
drop policy if exists "Anyone can create a booking" on public.bookings;

create policy "Staff can view all bookings" on public.bookings for select using (is_staff());
create policy "Staff can update all bookings" on public.bookings for update using (is_staff());
create policy "Staff can delete bookings" on public.bookings for delete using (is_staff());

-- SMART LINKING POLICY: Allow clients to view bookings by ID OR by matching Email
-- Audit recommendation: In production, consider enforcing email_verified = true
drop policy if exists "Clients can view own bookings" on public.bookings;
create policy "Clients can view own bookings" on public.bookings for select using (
  auth.uid() = client_id 
  OR 
  lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
);

create policy "Anyone can create a booking" on public.bookings for insert with check (true);

-- Invoices Policies
drop policy if exists "Staff can manage invoices" on public.invoices;
drop policy if exists "Clients can view own invoices" on public.invoices;
create policy "Staff can manage invoices" on public.invoices for all using (is_staff());
create policy "Clients can view own invoices" on public.invoices for select using (
  exists (
    select 1 from public.bookings
    where bookings.id = invoices.booking_id
    and (
      bookings.client_id = auth.uid()
      OR
      lower(trim(bookings.email)) = lower(trim(auth.jwt() ->> 'email'))
    )
  )
);

-- Expenses Policies
drop policy if exists "Staff can manage expenses" on public.expenses;
create policy "Staff can manage expenses" on public.expenses for all using (is_staff());

-- Settings/CMS Policies
drop policy if exists "Public read settings" on public.business_settings;
drop policy if exists "Admin update settings" on public.business_settings;
create policy "Public read settings" on public.business_settings for select using (true);
create policy "Admin update settings" on public.business_settings for update using (is_admin());

drop policy if exists "Public read adverts" on public.adverts;
drop policy if exists "Admin manage adverts" on public.adverts;
create policy "Public read adverts" on public.adverts for select using (true);
create policy "Admin manage adverts" on public.adverts for all using (is_admin());

drop policy if exists "Public read gallery" on public.gallery;
drop policy if exists "Admin manage gallery" on public.gallery;
create policy "Public read gallery" on public.gallery for select using (true);
create policy "Admin manage gallery" on public.gallery for all using (is_admin());

drop policy if exists "Public read services" on public.services;
drop policy if exists "Admin manage services" on public.services;
create policy "Public read services" on public.services for select using (true);
create policy "Admin manage services" on public.services for all using (is_admin());

-- 9. STORAGE POLICIES
-- Create images bucket if it doesn't exist
insert into storage.buckets (id, name, public) values ('images', 'images', true) on conflict do nothing;

drop policy if exists "Images are publicly accessible" on storage.objects;
create policy "Images are publicly accessible" on storage.objects for select using ( bucket_id = 'images' );

drop policy if exists "Admins can upload images" on storage.objects;
create policy "Admins can upload images" on storage.objects for insert with check ( bucket_id = 'images' and is_admin() );

drop policy if exists "Admins can update images" on storage.objects;
create policy "Admins can update images" on storage.objects for update using ( bucket_id = 'images' and is_admin() );

drop policy if exists "Admins can delete images" on storage.objects;
create policy "Admins can delete images" on storage.objects for delete using ( bucket_id = 'images' and is_admin() );


-- 10. TRIGGERS (Auto-Profile Creation & Booking Linking)

-- Trigger A: New User Signup -> Link existing guest bookings
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Create Profile
  insert into public.profiles (id, email, name, role)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'CLIENT'
  );

  -- Link existing "Guest" bookings to new user
  update public.bookings
  set client_id = new.id
  where lower(trim(email)) = lower(trim(new.email)) 
  and client_id is null;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger B: New Booking -> Link to existing user if email matches
create or replace function public.link_booking_to_user()
returns trigger as $$
begin
  -- If client_id is not set, try to find a user with matching email
  if new.client_id is null and new.email is not null then
    select id into new.client_id
    from public.profiles
    where lower(trim(email)) = lower(trim(new.email))
    limit 1;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_booking_created_link_user on public.bookings;
create trigger on_booking_created_link_user
  before insert on public.bookings
  for each row execute procedure public.link_booking_to_user();

-- RPC to manually sync bookings for the current user (Self-Healing)
create or replace function public.sync_user_bookings()
returns void as $$
declare
  u_email text;
begin
  u_email := auth.jwt() ->> 'email';
  if u_email is not null then
    update public.bookings
    set client_id = auth.uid()
    where client_id is null 
    and lower(trim(email)) = lower(trim(u_email));
  end if;
end;
$$ language plpgsql security definer;

-- 11. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';