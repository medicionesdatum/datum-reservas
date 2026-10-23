-- Blog administrable de DATUM.
-- Ejecutar una vez en Supabase antes de desplegar esta versión.

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null check (char_length(title) between 5 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text not null check (char_length(excerpt) between 20 and 500),
  content text not null check (char_length(content) between 80 and 60000),
  cover_image_url text,
  category text not null default 'Innovación' check (char_length(category) between 1 and 80),
  author_name text not null default 'Equipo DATUM' check (char_length(author_name) between 1 and 120),
  is_published boolean not null default false,
  published_at timestamptz,
  constraint blog_posts_slug_unique unique (slug),
  constraint blog_posts_publish_state check (
    (is_published = false and published_at is null)
    or (is_published = true and published_at is not null)
  )
);

create index if not exists blog_posts_publication_idx
on public.blog_posts (published_at desc)
where is_published = true;

create or replace function public.set_blog_post_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
before update on public.blog_posts
for each row execute function public.set_blog_post_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists "Service role manages blog posts" on public.blog_posts;
create policy "Service role manages blog posts"
on public.blog_posts
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-images',
  'blog-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
