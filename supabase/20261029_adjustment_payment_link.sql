-- El ajuste de saldo tiene su propio enlace de Square, separado del enlace de saldo.
-- Ejecutar una vez en Supabase (requiere antes 20261028_balance_adjustment.sql).
-- final_payment_link cobra siempre pending_balance; adjustment_payment_link cobra adjusted_balance.

alter table public.reservations
  add column if not exists adjustment_payment_link text,
  add column if not exists adjustment_square_reference text;
