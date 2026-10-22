alter table public.reservations
add column if not exists requires_invoice boolean not null default false,
add column if not exists billing_name text,
add column if not exists billing_tax_id text,
add column if not exists billing_address text,
add column if not exists billing_postal_code text,
add column if not exists billing_city text;
