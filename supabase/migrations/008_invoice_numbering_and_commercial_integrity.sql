create or replace function public.next_ipx_invoice_number()
returns jsonb language plpgsql security definer set search_path=public as $$
declare n bigint; y integer;
begin
  n := nextval('public.ipx_invoice_sequence'); y := extract(year from now() at time zone 'utc')::integer;
  return jsonb_build_object('sequence',n,'year',y);
end $$;
revoke all on function public.next_ipx_invoice_number() from public,anon,authenticated;

create unique index if not exists revenue_events_payment_service_kind_uq
on public.revenue_events(payment_transaction_id,service_code,event_kind)
where payment_transaction_id is not null;

alter table public.invoices add column if not exists processor_customer_ref jsonb not null default '{}'::jsonb;
alter table public.invoices add column if not exists payment_terms text;
alter table public.invoices add column if not exists external_po_number text;

create table public.refunds (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 invoice_id uuid not null references public.invoices(id), payment_transaction_id uuid references public.payment_transactions(id),
 amount_cents bigint not null check(amount_cents>0), currency text not null default 'USD', reason text,
 status text not null check(status in ('requested','processing','succeeded','failed','cancelled')) default 'requested',
 provider text, provider_ref text, requested_by uuid references auth.users(id), created_at timestamptz not null default now(), completed_at timestamptz
);
alter table public.refunds enable row level security;
create policy refunds_read on public.refunds for select to authenticated using(exists(select 1 from public.organization_members m where m.organization_id=refunds.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin')));

create table public.usage_events (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 service_code text not null, entitlement_id uuid references public.service_entitlements(id), meter text not null, quantity bigint not null check(quantity>0),
 idempotency_key text not null unique, occurred_at timestamptz not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index usage_events_org_meter_idx on public.usage_events(organization_id,meter,occurred_at);
alter table public.usage_events enable row level security;
create policy usage_events_read on public.usage_events for select to authenticated using(exists(select 1 from public.organization_members m where m.organization_id=usage_events.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin')));
