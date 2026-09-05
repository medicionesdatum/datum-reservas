-- Ejecutar una vez en Supabase antes de desplegar esta versión.

alter table public.reservations
add column if not exists payment_expires_at timestamptz;

update public.reservations
set payment_expires_at = created_at + interval '30 minutes'
where payment_expires_at is null;

alter table public.reservations
alter column payment_expires_at set default (now() + interval '30 minutes'),
alter column payment_expires_at set not null;

drop index if exists public.reservations_visit_slot_active_idx;
create unique index reservations_visit_slot_active_idx
on public.reservations (visit_date, visit_time)
where operational_status not in ('cancelado', 'reprogramado', 'pago_caducado');

create or replace function public.increment_discount_code_usage(target_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.discount_codes
  set times_used = times_used + 1
  where id = target_id;
$$;

revoke all on function public.increment_discount_code_usage(uuid) from public, anon, authenticated;
grant execute on function public.increment_discount_code_usage(uuid) to service_role;
