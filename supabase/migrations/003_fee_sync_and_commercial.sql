create table public.fee_sync_runs (
  id uuid primary key default gen_random_uuid(),
  authority text not null,
  source_url text not null,
  source_revision text not null,
  source_sha256 text not null,
  row_count integer not null check (row_count >= 0),
  status text not null check (status in ('staged','accepted','rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create table public.commercial_products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique,
  name text not null,
  category text not null,
  revenue_model text not null check (revenue_model in ('transaction','subscription','usage','seat','storage','professional','marketplace','enterprise','white_label')),
  base_service_parity boolean not null default false,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  product_code text not null references public.commercial_products(product_code),
  source_order_id uuid references public.orders(id),
  status text not null check (status in ('active','suspended','expired','revoked')),
  quantity bigint,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index entitlements_org_idx on public.entitlements(organization_id,product_code,status);

create table public.unit_economics (
  id uuid primary key default gen_random_uuid(),
  product_code text not null references public.commercial_products(product_code),
  period_start date not null,
  period_end date not null,
  revenue_cents bigint not null default 0,
  payment_cost_cents bigint not null default 0,
  provider_cost_cents bigint not null default 0,
  storage_cost_cents bigint not null default 0,
  labor_cost_cents bigint not null default 0,
  support_cost_cents bigint not null default 0,
  acquisition_cost_cents bigint not null default 0,
  fraud_loss_cents bigint not null default 0,
  gross_margin_cents bigint generated always as (revenue_cents-payment_cost_cents-provider_cost_cents-storage_cost_cents-labor_cost_cents-support_cost_cents-fraud_loss_cents) stored,
  contribution_margin_cents bigint generated always as (revenue_cents-payment_cost_cents-provider_cost_cents-storage_cost_cents-labor_cost_cents-support_cost_cents-acquisition_cost_cents-fraud_loss_cents) stored,
  metadata jsonb not null default '{}'::jsonb,
  unique(product_code,period_start,period_end)
);

alter table public.fee_sync_runs enable row level security;
alter table public.commercial_products enable row level security;
alter table public.entitlements enable row level security;
alter table public.unit_economics enable row level security;

create policy commercial_products_read on public.commercial_products for select to authenticated using (active=true);
create policy entitlements_read on public.entitlements for select to authenticated using (user_id=(select auth.uid()) or exists (select 1 from public.organization_members m where m.organization_id=entitlements.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin')));

insert into public.commercial_products(product_code,name,category,revenue_model,base_service_parity,metadata) values
('ipx-office-service','IPX Office Service','office','transaction',true,'{"pricing":"matched public reference fee"}'),
('watchdog-individual','IPX Watchdog Individual','monitoring','subscription',false,'{"max_assets":5,"cadence":"daily"}'),
('watchdog-professional','IPX Watchdog Professional','monitoring','subscription',false,'{"max_assets":100,"cadence":"hourly"}'),
('watchdog-enterprise','IPX Watchdog Enterprise','monitoring','enterprise',false,'{"max_assets":null,"cadence":"hourly","white_label":true}'),
('ipx-vault','IPX Vault','storage','storage',false,'{}'),
('ipx-portfolio','IPX Portfolio','portfolio','subscription',false,'{}'),
('ipx-trust-api','IPX Trust API','developer','usage',false,'{}'),
('ipx-white-label','IPX White Label','enterprise','white_label',false,'{}'),
('ipx-diligence-room','IPX Diligence Room','commercialization','transaction',false,'{}'),
('ipx-professional','IPX Professional Services','professional','professional',false,'{}'),
('ipx-exchange','IPX Exchange','commercialization','marketplace',false,'{}')
on conflict (product_code) do nothing;
