create extension if not exists pgcrypto;

create table staff (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null, display_name text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz default now()
);
alter table staff enable row level security;

create or replace function is_staff()
returns boolean language sql security definer stable set search_path = public
as $$ select exists (select 1 from staff where id = auth.uid()); $$;

create or replace function is_admin()
returns boolean language sql security definer stable set search_path = public
as $$ select exists (select 1 from staff where id = auth.uid() and role = 'admin'); $$;

create policy "staff view own row or admin views all" on staff
  for select to authenticated using (id = auth.uid() or is_admin());
create policy "admin manages staff" on staff
  for all to authenticated using (is_admin()) with check (is_admin());

create table destinations (
  id text primary key, name_ar text not null, name_fr text not null,
  country text not null, image text, created_at timestamptz default now()
);
alter table destinations enable row level security;
create policy "public read destinations" on destinations for select to anon, authenticated using (true);
create policy "admin write destinations" on destinations for insert to authenticated with check (is_admin());
create policy "admin update destinations" on destinations for update to authenticated using (is_admin());
create policy "admin delete destinations" on destinations for delete to authenticated using (is_admin());

create table packages (
  id text primary key, destination_id text not null references destinations(id),
  title text not null, slug text not null unique, image text not null,
  short_description text, description text, duration_days integer not null,
  price_per_person numeric not null, includes text[] default '{}', excludes text[] default '{}',
  featured boolean default false, active boolean not null default true,
  created_at timestamptz default now()
);
alter table packages enable row level security;
create policy "public read packages" on packages for select to anon, authenticated using (true);
create policy "admin write packages" on packages for insert to authenticated with check (is_admin());
create policy "admin update packages" on packages for update to authenticated using (is_admin());
create policy "admin delete packages" on packages for delete to authenticated using (is_admin());

create table package_departures (
  id uuid primary key default gen_random_uuid(),
  package_id text not null references packages(id) on delete cascade,
  departure_date date not null, return_date date not null,
  seats_total integer not null default 20, seats_booked integer not null default 0,
  price_override numeric, created_at timestamptz default now()
);
alter table package_departures enable row level security;
create policy "public read departures" on package_departures for select to anon, authenticated using (true);
create policy "admin write departures" on package_departures for insert to authenticated with check (is_admin());
create policy "admin update departures" on package_departures for update to authenticated using (is_admin());
create policy "admin delete departures" on package_departures for delete to authenticated using (is_admin());

create table hotels (
  id text primary key, destination_id text not null references destinations(id),
  name text not null, slug text not null unique, image text not null, description text,
  star_rating integer not null default 3 check (star_rating between 1 and 5),
  amenities text[] default '{}', address text, featured boolean default false,
  active boolean not null default true, created_at timestamptz default now()
);
alter table hotels enable row level security;
create policy "public read hotels" on hotels for select to anon, authenticated using (true);
create policy "admin write hotels" on hotels for insert to authenticated with check (is_admin());
create policy "admin update hotels" on hotels for update to authenticated using (is_admin());
create policy "admin delete hotels" on hotels for delete to authenticated using (is_admin());

create table hotel_rooms (
  id uuid primary key default gen_random_uuid(), hotel_id text not null references hotels(id) on delete cascade,
  name text not null, price_per_night numeric not null, capacity integer not null default 2,
  image text, active boolean not null default true, created_at timestamptz default now()
);
alter table hotel_rooms enable row level security;
create policy "public read rooms" on hotel_rooms for select to anon, authenticated using (true);
create policy "admin write rooms" on hotel_rooms for insert to authenticated with check (is_admin());
create policy "admin update rooms" on hotel_rooms for update to authenticated using (is_admin());
create policy "admin delete rooms" on hotel_rooms for delete to authenticated using (is_admin());

create table bookings (
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
  booking_type text not null check (booking_type in ('package', 'hotel')),
  customer_name text not null, customer_phone text not null, customer_email text not null, notes text,
  package_id text references packages(id), departure_id uuid references package_departures(id), travelers_count integer,
  hotel_id text references hotels(id), room_id uuid references hotel_rooms(id),
  check_in date, check_out date, rooms_count integer, guests_count integer,
  estimated_total numeric not null default 0,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  tracking_token text not null unique default encode(gen_random_bytes(6), 'hex')
);
alter table bookings enable row level security;
create policy "public insert bookings" on bookings for insert to anon, authenticated with check (true);
create policy "staff read bookings" on bookings for select to authenticated using (is_staff());
create policy "staff update booking status" on bookings for update to authenticated using (is_staff());
create policy "admin delete bookings" on bookings for delete to authenticated using (is_admin());

create or replace function track_booking(p_phone text, p_token text)
returns setof bookings language sql security definer stable set search_path = public
as $$ select * from bookings where customer_phone = p_phone and tracking_token = p_token; $$;

create table landing_pages (
  slug text primary key, title text not null, hero_image text, content_blocks jsonb default '[]',
  active boolean not null default false, starts_at timestamptz, ends_at timestamptz,
  created_at timestamptz default now()
);
alter table landing_pages enable row level security;
create policy "public read active landing pages" on landing_pages for select to anon, authenticated using (active = true);
create policy "admin read all landing pages" on landing_pages for select to authenticated using (is_admin());
create policy "admin write landing pages" on landing_pages for insert to authenticated with check (is_admin());
create policy "admin update landing pages" on landing_pages for update to authenticated using (is_admin());
create policy "admin delete landing pages" on landing_pages for delete to authenticated using (is_admin());

create policy "public read travel images" on storage.objects for select to anon, authenticated using (bucket_id = 'travel-images');
create policy "admin upload travel images" on storage.objects for insert to authenticated with check (bucket_id = 'travel-images' and is_admin());
create policy "admin update travel images" on storage.objects for update to authenticated using (bucket_id = 'travel-images' and is_admin());
create policy "admin delete travel images" on storage.objects for delete to authenticated using (bucket_id = 'travel-images' and is_admin());
