create table if not exists public.reservations (
  id uuid primary key,
  created_at timestamptz not null default now(),
  customer_name text not null,
  email text not null,
  phone text not null,
  full_address text not null,
  street text,
  number text,
  floor text,
  postal_code text not null,
  surface numeric not null,
  property_floors integer not null,
  service_id text not null check (service_id in ('point_cloud', 'plans_2d', 'revit_3d')),
  range_label text not null,
  base_price numeric not null,
  additional_plans integer not null default 0,
  additional_sections integer not null default 0,
  additional_elevations integer not null default 0,
  additional_unit_price numeric not null,
  additional_total numeric not null,
  representation text not null check (representation in ('geometria_real', 'representacion_ortogonalizada')),
  visit_date date not null,
  visit_time text not null,
  taxable_base numeric not null,
  discount_amount numeric not null default 0,
  coupon_code text,
  vat numeric not null,
  total numeric not null,
  deposit numeric not null,
  pending_balance numeric not null,
  payment_status text not null default 'pendiente',
  operational_status text not null default 'pendiente_de_pago',
  deposit_payment_link text,
  deposit_square_reference text,
  final_payment_link text,
  final_square_reference text,
  notes text,
  internal_notes text,
  accepts_marketing boolean not null default false
);

create unique index if not exists reservations_visit_slot_active_idx
on public.reservations (visit_date, visit_time)
where operational_status not in ('cancelado', 'reprogramado');

alter table public.reservations enable row level security;

create policy "Service role manages reservations"
on public.reservations
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  visit_date date not null,
  visit_time text not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (visit_date, visit_time)
);

alter table public.blocked_slots enable row level security;

create policy "Service role manages blocked slots"
on public.blocked_slots
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.square_webhook_events (
  event_id text primary key,
  event_type text not null,
  payment_id text,
  reservation_id uuid,
  processed_at timestamptz not null default now()
);

alter table public.square_webhook_events enable row level security;

create policy "Service role manages Square webhook events"
on public.square_webhook_events
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
