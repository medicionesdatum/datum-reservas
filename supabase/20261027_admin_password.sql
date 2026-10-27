-- Clave del portal administrativo cambiable desde /admin.
-- Ejecutar una vez en Supabase antes de usar "Cambiar clave".
-- Guarda solo el hash (scrypt). Mientras no haya fila, se usa ADMIN_PASSWORD.
-- Para volver a ADMIN_PASSWORD: delete from public.admin_credentials;

create table if not exists public.admin_credentials (
  id integer primary key default 1 check (id = 1),
  password_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.admin_credentials enable row level security;
