alter table public.discount_codes
add column if not exists one_per_email boolean not null default false;

create table if not exists public.discount_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  discount_code_id uuid not null references public.discount_codes(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  email text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists discount_code_redemptions_email_unique_idx
on public.discount_code_redemptions (discount_code_id, lower(email));

alter table public.discount_code_redemptions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'discount_code_redemptions'
      and policyname = 'Service role manages discount code redemptions'
  ) then
    create policy "Service role manages discount code redemptions"
    on public.discount_code_redemptions
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
  end if;
end $$;
