-- Ajuste del saldo final desde /admin ("Ajuste de importe").
-- Ejecutar una vez en Supabase antes de usar el botón.
-- No modifica pending_balance ni los importes calculados: el importe a cobrar
-- es adjusted_balance cuando existe y pending_balance en caso contrario.

alter table public.reservations
  add column if not exists adjusted_balance numeric
    check (adjusted_balance is null or (adjusted_balance >= 0.01 and adjusted_balance <= 50000)),
  add column if not exists balance_adjustment_reason text
    check (balance_adjustment_reason is null or char_length(balance_adjustment_reason) between 5 and 200);
