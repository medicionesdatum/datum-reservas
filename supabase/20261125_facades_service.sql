-- Nuevo servicio "Solo fachadas" (service_id = 'facades').
-- Ejecutar una vez en Supabase ANTES de desplegar esta versión: las reservas de este
-- servicio fallarían al insertarse por la restricción antigua. Las reservas existentes no cambian.

alter table public.reservations
  drop constraint if exists reservations_service_id_check;

alter table public.reservations
  add constraint reservations_service_id_check
  check (service_id in ('point_cloud', 'plans_floor', 'facades', 'plans_2d', 'revit_3d'));
