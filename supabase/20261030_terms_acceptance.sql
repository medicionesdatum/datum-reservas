-- Constancia de la aceptación de condiciones al reservar.
-- Ejecutar una vez en Supabase ANTES de desplegar esta versión: la ruta de reservas
-- escribe estas columnas y las reservas nuevas fallarían si no existen.
-- Las reservas anteriores quedan con las columnas vacías.

alter table public.reservations
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists balance_terms_accepted_at timestamptz;
