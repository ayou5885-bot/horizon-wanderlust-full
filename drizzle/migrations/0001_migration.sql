-- Data API grants for Step 1 tables (required; RLS still applies)
grant select on public.destinations, public.packages, public.package_departures, public.hotels, public.hotel_rooms, public.landing_pages to anon;
grant insert on public.bookings to anon;
grant select, insert, update, delete on public.staff, public.destinations, public.packages, public.package_departures, public.hotels, public.hotel_rooms, public.bookings, public.landing_pages to authenticated;
grant all on public.staff, public.destinations, public.packages, public.package_departures, public.hotels, public.hotel_rooms, public.bookings, public.landing_pages to service_role;
grant execute on function public.track_booking(text, text) to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- Site settings
create table public.site_settings (
  id integer primary key default 1 check (id = 1),
  favicon_url text,
  updated_at timestamptz default now()
);
grant select on public.site_settings to anon;
grant select, insert, update, delete on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "public read site settings" on public.site_settings for select to anon, authenticated using (true);
create policy "admin write site settings" on public.site_settings for insert to authenticated with check (is_admin());
create policy "admin update site settings" on public.site_settings for update to authenticated using (is_admin());
create policy "admin delete site settings" on public.site_settings for delete to authenticated using (is_admin());
insert into public.site_settings (id) values (1);

-- Status change with seat accounting (staff-callable; staff cannot update departures directly)
create or replace function public.set_booking_status(p_booking_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare b bookings; d package_departures;
begin
  if not is_staff() then raise exception 'not_authorized'; end if;
  if p_status not in ('pending','confirmed','cancelled','completed') then raise exception 'invalid_status'; end if;
  select * into b from bookings where id = p_booking_id for update;
  if not found then raise exception 'not_found'; end if;
  if b.booking_type = 'package' and b.departure_id is not null then
    select * into d from package_departures where id = b.departure_id for update;
    if p_status = 'confirmed' and b.status <> 'confirmed' then
      if d.seats_booked + coalesce(b.travelers_count,0) > d.seats_total then
        raise exception 'seats_exceeded';
      end if;
      update package_departures set seats_booked = seats_booked + coalesce(b.travelers_count,0) where id = d.id;
    elsif b.status = 'confirmed' and p_status in ('pending','cancelled') then
      update package_departures set seats_booked = greatest(0, seats_booked - coalesce(b.travelers_count,0)) where id = d.id;
    end if;
  end if;
  update bookings set status = p_status where id = p_booking_id;
end; $$;
grant execute on function public.set_booking_status(uuid, text) to authenticated;

-- First signed-in user may claim admin while no staff exists
create or replace function public.claim_first_admin()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from staff) then return false; end if;
  insert into staff (id, email, role) select id, email, 'admin' from auth.users where id = auth.uid();
  return true;
end; $$;
grant execute on function public.claim_first_admin() to authenticated;

-- Demo content
insert into public.destinations (id, name_ar, name_fr, country, image) values
('istanbul','إسطنبول','Istanbul','Turquie','/images/istanbul.jpg'),
('dubai','دبي','Dubaï','Émirats arabes unis','/images/dubai.jpg'),
('hammamet','الحمامات','Hammamet','Tunisie','/images/hammamet.jpg'),
('cairo','القاهرة','Le Caire','Égypte','/images/cairo.jpg');

insert into public.packages (id, destination_id, title, slug, image, short_description, description, duration_days, price_per_person, includes, excludes, featured) values
('pkg-istanbul-8','istanbul','Istanbul Classique — 8 jours','istanbul-classique','/images/istanbul.jpg','Bosphore, Sainte-Sophie et Grand Bazar.','Un circuit complet entre Europe et Asie : croisière sur le Bosphore, visites guidées de la vieille ville et temps libre pour le shopping.',8,145000,array['Vol aller-retour','Hôtel 4★ avec petit-déjeuner','Transferts aéroport','Guide francophone'],array['Visa','Déjeuners et dîners','Dépenses personnelles'],true),
('pkg-dubai-6','dubai','Dubaï Découverte — 6 jours','dubai-decouverte','/images/dubai.jpg','Burj Khalifa, désert et marina.','Safari dans le désert, dîner-croisière sur la marina et accès au Burj Khalifa.',6,210000,array['Vol aller-retour','Hôtel 4★','Safari désert','Visa touristique'],array['Repas non mentionnés','Pourboires'],true),
('pkg-hammamet-7','hammamet','Hammamet Détente — 7 jours','hammamet-detente','/images/hammamet.jpg','Plages et médina en formule tout compris.','Une semaine de repos en bord de mer, en formule all inclusive, avec excursion à Sidi Bou Saïd.',7,89000,array['Transport en bus climatisé','Hôtel 5★ all inclusive','Excursion Sidi Bou Saïd'],array['Assurance voyage'],true),
('pkg-cairo-5','cairo','Le Caire & Pyramides — 5 jours','caire-pyramides','/images/cairo.jpg','Pyramides de Gizeh et musée égyptien.','Visite des pyramides, du Sphinx, du musée égyptien et croisière sur le Nil.',5,125000,array['Vol aller-retour','Hôtel 4★','Entrées des sites'],array['Visa','Pourboires'],false);

insert into public.package_departures (package_id, departure_date, return_date, seats_total, seats_booked) values
('pkg-istanbul-8', current_date + 20, current_date + 27, 20, 6),
('pkg-istanbul-8', current_date + 50, current_date + 57, 20, 20),
('pkg-dubai-6', current_date + 15, current_date + 20, 15, 3),
('pkg-dubai-6', current_date + 45, current_date + 50, 15, 0),
('pkg-hammamet-7', current_date + 10, current_date + 16, 40, 12),
('pkg-cairo-5', current_date + 30, current_date + 34, 25, 5);

insert into public.hotels (id, destination_id, name, slug, image, description, star_rating, amenities, address, featured) values
('htl-bosphorus','istanbul','Bosphorus Palace','bosphorus-palace','/images/istanbul.jpg','Hôtel élégant face au Bosphore, à deux pas de Sultanahmet.',5,array['Wi-Fi','Piscine','Spa','Restaurant'],'Sultanahmet, Istanbul',true),
('htl-marina','dubai','Marina Bay Suites','marina-bay-suites','/images/dubai.jpg','Suites modernes avec vue sur la marina de Dubaï.',4,array['Wi-Fi','Piscine','Salle de sport'],'Dubai Marina',true),
('htl-yasmine','hammamet','Yasmine Beach Resort','yasmine-beach','/images/hammamet.jpg','Resort en bord de plage, idéal pour les familles.',4,array['Plage privée','Piscine','Club enfants','All inclusive'],'Yasmine Hammamet',true),
('htl-nile','cairo','Nile View Hotel','nile-view','/images/cairo.jpg','Vue panoramique sur le Nil au cœur du Caire.',3,array['Wi-Fi','Restaurant'],'Zamalek, Le Caire',false);

insert into public.hotel_rooms (hotel_id, name, price_per_night, capacity) values
('htl-bosphorus','Chambre Double',18000,2),('htl-bosphorus','Suite Vue Mer',32000,3),
('htl-marina','Studio',22000,2),('htl-marina','Suite Familiale',38000,4),
('htl-yasmine','Chambre Standard',12000,2),('htl-yasmine','Chambre Familiale',19000,4),
('htl-nile','Chambre Double',9000,2);

insert into public.landing_pages (slug, title, hero_image, content_blocks, active) values
('ete-2026','Offres été — Jusqu''à -20 %','/images/hammamet.jpg','[{"type":"text","heading":"L''été commence ici","body":"Réservez avant la fin du mois et profitez de remises exclusives sur nos séjours en Tunisie et en Turquie."},{"type":"cta","label":"Voir les circuits","href":"/packages"}]'::jsonb,true);
