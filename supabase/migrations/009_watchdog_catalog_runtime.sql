-- Align the Watchdog runtime with the configurable service catalog introduced in 006.
-- No price is invented here. Commercial operators must configure service_prices
-- explicitly before the recurring product can be sold.

update public.service_catalog
set recurring_interval = 'month',
    updated_at = now()
where service_code = 'ipx-watchdog'
  and pricing_basis = 'recurring'
  and recurring_interval is null;

alter table public.service_catalog
  drop constraint if exists service_catalog_recurring_interval_required;

alter table public.service_catalog
  add constraint service_catalog_recurring_interval_required
  check (pricing_basis <> 'recurring' or recurring_interval is not null);

-- Make each active price identity unambiguous for a service/plan/effective date.
-- Multiple historical prices remain possible through different effective dates.
create unique index if not exists service_prices_identity_idx
  on public.service_prices(service_catalog_id, entity_tier, effective_from);

comment on column public.service_prices.entity_tier is
  'Commercial plan key for non-reference services; legacy name retained for schema compatibility.';
