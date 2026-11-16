-- Reseñas de Google seleccionadas por DATUM y datos de la ficha de Google.
-- Ejecutar una vez en Supabase antes de desplegar esta versión.

create table if not exists public.google_reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  author_name text not null check (char_length(author_name) between 1 and 80),
  review_text text not null check (char_length(review_text) between 10 and 1500),
  rating smallint not null default 5 check (rating between 1 and 5),
  review_label text check (review_label is null or char_length(review_label) <= 40),
  is_visible boolean not null default true,
  sort_order integer not null default 0
);

create index if not exists google_reviews_visible_idx
on public.google_reviews (sort_order, created_at desc)
where is_visible = true;

create table if not exists public.google_reviews_settings (
  id integer primary key default 1 check (id = 1),
  updated_at timestamptz not null default now(),
  profile_url text check (profile_url is null or profile_url ~ '^https://'),
  write_review_url text check (write_review_url is null or write_review_url ~ '^https://'),
  rating_average numeric(2, 1) check (rating_average is null or rating_average between 1 and 5),
  review_count integer check (review_count is null or review_count >= 0)
);

create or replace function public.set_google_reviews_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists google_reviews_set_updated_at on public.google_reviews;
create trigger google_reviews_set_updated_at
before update on public.google_reviews
for each row execute function public.set_google_reviews_updated_at();

drop trigger if exists google_reviews_settings_set_updated_at on public.google_reviews_settings;
create trigger google_reviews_settings_set_updated_at
before update on public.google_reviews_settings
for each row execute function public.set_google_reviews_updated_at();

alter table public.google_reviews enable row level security;
alter table public.google_reviews_settings enable row level security;

drop policy if exists "Service role manages google reviews" on public.google_reviews;
create policy "Service role manages google reviews"
on public.google_reviews
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role manages google reviews settings" on public.google_reviews_settings;
create policy "Service role manages google reviews settings"
on public.google_reviews_settings
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
