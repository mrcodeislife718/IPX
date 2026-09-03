-- IPX owns its commercial model. Payment processors are collection rails only.
-- This migration removes temporary Watchdog tier assumptions and introduces a
-- versioned service catalog capable of representing the full IPX office-equivalent
-- service surface plus additional IPX capabilities.

create table public.service_catalog (
  id uuid primary key default gen_random_uuid(),
  service_code text not null,
  version integer not null default 1 check (version > 0),
  name text not null,
  service_family text not null,
  description text,
  pricing_basis text not null check (pricing_basis in ('reference_parity','fixed','recurring','usage','seat','storage','transaction','enterprise_quote','custom_quote')),
  reference_authority text,
  reference_service_code text,
  recurring_interval text check (recurring_interval is null or recurring_interval in ('month','year')),
  active boolean not null default true,
  effective_from date not null default current_date,
  effective_to date,
  capabilities jsonb not null default '{}'::jsonb,
  commercial_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(service_code, version),
  check (effective_to is null or effective_to >= effective_from),
  check ((pricing_basis <> 'reference_parity') or (reference_authority is not null and reference_service_code is not null))
);
create index service_catalog_active_idx on public.service_catalog(service_code,effective_from desc) where active=true;

create table public.service_prices (
  id uuid primary key default gen_random_uuid(),
  service_catalog_id uuid not null references public.service_catalog(id) on delete cascade,
  entity_tier text not null default 'not_applicable',
  currency text not null default 'USD',
  amount_cents bigint check (amount_cents is null or amount_cents >= 0),
  unit_name text,
  included_quantity bigint check (included_quantity is null or included_quantity >= 0),
  overage_amount_cents bigint check (overage_amount_cents is null or overage_amount_cents >= 0),
  source_fee_catalog_id uuid references public.fee_catalog(id),
  effective_from date not null default current_date,
  effective_to date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);
create index service_prices_current_idx on public.service_prices(service_catalog_id,entity_tier,effective_from desc);

-- Migrate Watchdog away from hard-coded individual/professional/enterprise tiers.
alter table public.watchdog_subscriptions add column if not exists service_catalog_id uuid references public.service_catalog(id);
alter table public.watchdog_subscriptions add column if not exists commercial_terms jsonb not null default '{}'::jsonb;
alter table public.watchdog_subscriptions alter column tier drop not null;
alter table public.watchdog_subscriptions drop constraint if exists watchdog_subscriptions_tier_check;

-- The old starter products are historical assumptions, not active IPX product truth.
update public.commercial_products
set active=false,
    metadata = metadata || '{"retired_reason":"temporary starter tier assumption replaced by configurable IPX service catalog"}'::jsonb,
    updated_at=now()
where product_code in ('watchdog-individual','watchdog-professional','watchdog-enterprise');

insert into public.commercial_products(product_code,name,category,revenue_model,base_service_parity,metadata) values
('ipx-watchdog','IPX Watchdog','monitoring','subscription',false,'{"pricing":"service_catalog","role":"additional paid IP protection capability"}')
on conflict (product_code) do update set active=true, metadata=excluded.metadata, updated_at=now();

-- Service families describe IPX's commercial surface without hard-coding prices.
insert into public.service_catalog(service_code,name,service_family,description,pricing_basis,reference_authority,reference_service_code,capabilities,commercial_rules) values
('ipx-patent-utility','IPX Utility Protection Service','patent','IPX private utility-protection workflow and lifecycle record.','reference_parity','USPTO','patent-utility','{"provenance":true,"lifecycle":true,"exportable_record":true}','{"government_fee_included":false}'),
('ipx-patent-design','IPX Design Protection Service','patent','IPX private design-protection workflow and lifecycle record.','reference_parity','USPTO','patent-design','{"provenance":true,"lifecycle":true,"exportable_record":true}','{"government_fee_included":false}'),
('ipx-trademark','IPX Trademark Service','trademark','IPX private trademark protection and lifecycle workflow.','reference_parity','USPTO','trademark-application','{"provenance":true,"lifecycle":true,"monitoring_eligible":true}','{"government_fee_included":false}'),
('ipx-copyright','IPX Copyright Service','copyright','IPX private authorship, ownership, evidence, and lifecycle workflow.','reference_parity','USCO','copyright-registration','{"provenance":true,"lifecycle":true,"monitoring_eligible":true}','{"government_fee_included":false}'),
('ipx-prior-art-search','IPX Prior Art Search','search','Search, evidence trail, and review workflow for prior art.','custom_quote',null,null,'{"evidence_trail":true,"human_review_capable":true}','{}'),
('ipx-freedom-to-operate','IPX Freedom-to-Operate Analysis','search','Evidence-backed freedom-to-operate analysis workflow.','custom_quote',null,null,'{"evidence_trail":true,"human_review_capable":true}','{"not_legal_determination":true}'),
('ipx-defensive-publication','IPX Defensive Publication','publication','Timestamped defensive publication and preservation workflow.','fixed',null,null,'{"provenance":true,"exportable_record":true}','{}'),
('ipx-assignment-transfer','IPX Assignment & Transfer','ownership','Ownership-chain and transfer workflow.','reference_parity','USPTO','assignment-recordation','{"ownership_chain":true,"audit_trail":true}','{"government_fee_included":false}'),
('ipx-maintenance-renewal','IPX Maintenance & Renewal','maintenance','Lifecycle maintenance, renewal, deadline, and evidence workflow.','reference_parity','USPTO','maintenance','{"docketing":true,"reminders":true,"audit_trail":true}','{"government_fee_included":false}'),
('ipx-international','IPX International Protection Service','international','International/PCT-style private workflow and portfolio coordination.','reference_parity','USPTO','pct','{"multi_jurisdiction":true,"lifecycle":true}','{"government_fee_included":false}'),
('ipx-watchdog','IPX Watchdog','monitoring','Continuous monitoring and evidence-preserving alerts for possible IP misuse.','recurring',null,null,'{"continuous_monitoring":true,"evidence_preservation":true,"risk_scoring":true,"alerts":true}','{"pricing_must_be_configured":true}'),
('ipx-vault','IPX Vault','evidence','Secure evidence preservation and exportable verification records.','storage',null,null,'{"evidence_preservation":true,"exportable_record":true}','{}'),
('ipx-portfolio','IPX Portfolio','portfolio','Portfolio lifecycle administration and intelligence.','enterprise_quote',null,null,'{"portfolio_management":true,"team_workflows":true}','{}'),
('ipx-trust-api','IPX Trust API','platform','Developer and enterprise API access to IPX trust infrastructure.','usage',null,null,'{"api":true,"webhooks":true}','{}'),
('ipx-white-label','IPX White Label','platform','Embedded/white-label IPX infrastructure for partners and enterprises.','enterprise_quote',null,null,'{"white_label":true,"api":true}','{}'),
('ipx-diligence','IPX Diligence','commercialization','Diligence and transaction-readiness workflow.','custom_quote',null,null,'{"diligence_room":true,"evidence_export":true}','{}'),
('ipx-exchange','IPX Exchange','commercialization','Licensing, transfer, and commercialization transaction infrastructure.','transaction',null,null,'{"licensing":true,"transfers":true,"transactions":true}','{}')
on conflict (service_code,version) do nothing;

alter table public.service_catalog enable row level security;
alter table public.service_prices enable row level security;
create policy service_catalog_read on public.service_catalog for select to authenticated using (active=true and effective_from<=current_date and (effective_to is null or effective_to>=current_date));
create policy service_prices_read on public.service_prices for select to authenticated using (effective_from<=current_date and (effective_to is null or effective_to>=current_date));
