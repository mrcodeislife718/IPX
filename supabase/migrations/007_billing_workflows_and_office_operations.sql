-- IPX owns invoices, payments, revenue state, service workflows and docketing.
-- External processors are replaceable collection rails.

create sequence if not exists public.ipx_invoice_sequence start 1;

create table public.billing_customers (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid references auth.users(id) on delete set null, display_name text not null, billing_email text,
 billing_address jsonb not null default '{}'::jsonb, tax_profile jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index billing_customers_org_idx on public.billing_customers(organization_id);

create table public.invoices (
 id uuid primary key default gen_random_uuid(), invoice_number text not null unique,
 organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid references auth.users(id), billing_customer_id uuid references public.billing_customers(id),
 quote_id uuid references public.price_quotes(id), status text not null check(status in ('draft','open','paid','past_due','void','refunded','partially_refunded')),
 currency text not null default 'USD', subtotal_cents bigint not null check(subtotal_cents>=0), tax_cents bigint not null default 0 check(tax_cents>=0), credit_cents bigint not null default 0 check(credit_cents>=0), total_cents bigint not null check(total_cents>=0),
 invoice_hash text not null unique, issued_at timestamptz, due_at timestamptz, paid_at timestamptz, metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index invoices_org_idx on public.invoices(organization_id,created_at desc);

create table public.invoice_lines (
 id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.invoices(id) on delete cascade,
 service_code text not null, description text not null, quantity bigint not null default 1 check(quantity>0), unit_amount_cents bigint not null check(unit_amount_cents>=0), amount_cents bigint not null check(amount_cents>=0), metadata jsonb not null default '{}'::jsonb
);

create table public.payment_transactions (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 invoice_id uuid references public.invoices(id), order_id uuid references public.orders(id), provider text not null,
 provider_object_type text not null, provider_object_id text not null, kind text not null check(kind in ('authorization','capture','payment','refund','dispute','credit','adjustment')),
 status text not null, amount_cents bigint not null, currency text not null default 'USD', occurred_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb,
 unique(provider,provider_object_type,provider_object_id,kind)
);
create index payment_transactions_invoice_idx on public.payment_transactions(invoice_id,occurred_at);

create table public.revenue_events (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 invoice_id uuid references public.invoices(id), payment_transaction_id uuid references public.payment_transactions(id), service_code text not null,
 event_kind text not null check(event_kind in ('billed','collected','refunded','credited','recognized','reversed')),
 gross_amount_cents bigint not null, processor_cost_cents bigint not null default 0, provider_cost_cents bigint not null default 0, currency text not null default 'USD',
 occurred_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb
);
create index revenue_events_service_idx on public.revenue_events(service_code,occurred_at);

create table public.service_cases (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 record_id uuid references public.ip_records(id) on delete cascade, service_code text not null, entitlement_id uuid references public.service_entitlements(id),
 status text not null check(status in ('intake','evidence','search','review','action_required','ready','completed','cancelled','blocked')) default 'intake',
 jurisdiction text not null default 'US', assigned_user_id uuid references auth.users(id), workflow_version integer not null default 1,
 state jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), completed_at timestamptz
);
create index service_cases_org_idx on public.service_cases(organization_id,status,created_at desc);

create table public.case_tasks (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references public.service_cases(id) on delete cascade,
 task_code text not null, title text not null, status text not null check(status in ('pending','ready','in_progress','blocked','completed','waived')) default 'pending',
 required boolean not null default true, assigned_user_id uuid references auth.users(id), due_at timestamptz, completed_at timestamptz,
 dependencies jsonb not null default '[]'::jsonb, evidence_requirements jsonb not null default '[]'::jsonb, metadata jsonb not null default '{}'::jsonb,
 unique(case_id,task_code)
);

create table public.docket_deadlines (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 record_id uuid references public.ip_records(id) on delete cascade, case_id uuid references public.service_cases(id) on delete cascade,
 jurisdiction text not null, rule_code text not null, title text not null, due_at timestamptz not null,
 status text not null check(status in ('open','satisfied','waived','missed','superseded')) default 'open', source_event_id uuid references public.ip_events(id),
 calculation jsonb not null default '{}'::jsonb, reminders jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index docket_deadlines_due_idx on public.docket_deadlines(status,due_at);

create table public.ownership_chain (
 id uuid primary key default gen_random_uuid(), record_id uuid not null references public.ip_records(id) on delete cascade,
 from_party_id uuid references public.ip_parties(id), to_party_id uuid references public.ip_parties(id), event_type text not null check(event_type in ('asserted','assigned','licensed','transferred','corrected','terminated')),
 effective_at timestamptz not null, evidence_item_id uuid references public.evidence_items(id), instrument_hash text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index ownership_chain_record_idx on public.ownership_chain(record_id,effective_at);

create table public.search_jobs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 record_id uuid references public.ip_records(id) on delete cascade, case_id uuid references public.service_cases(id) on delete cascade,
 search_kind text not null check(search_kind in ('prior_art','novelty','freedom_to_operate','trademark_clearance','watchdog','classification')),
 query_spec jsonb not null, status text not null check(status in ('queued','running','complete','partial','failed')) default 'queued',
 result_summary jsonb not null default '{}'::jsonb, query_hash text not null, started_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now()
);
create index search_jobs_org_idx on public.search_jobs(organization_id,created_at desc);

create table public.search_results (
 id uuid primary key default gen_random_uuid(), search_job_id uuid not null references public.search_jobs(id) on delete cascade,
 source_kind text not null, source_identifier text not null, source_url text, title text, published_at timestamptz,
 lexical_score numeric(7,6), semantic_score numeric(7,6), citation_score numeric(7,6), combined_score numeric(7,6),
 content_hash text, explanation jsonb not null default '{}'::jsonb, evidence_item_id uuid references public.evidence_items(id), created_at timestamptz not null default now(),
 unique(search_job_id,source_kind,source_identifier)
);

alter table public.billing_customers enable row level security; alter table public.invoices enable row level security; alter table public.invoice_lines enable row level security;
alter table public.payment_transactions enable row level security; alter table public.revenue_events enable row level security; alter table public.service_cases enable row level security;
alter table public.case_tasks enable row level security; alter table public.docket_deadlines enable row level security; alter table public.ownership_chain enable row level security;
alter table public.search_jobs enable row level security; alter table public.search_results enable row level security;

create policy billing_customers_read on public.billing_customers for select to authenticated using(exists(select 1 from public.organization_members m where m.organization_id=billing_customers.organization_id and m.user_id=(select auth.uid())));
create policy invoices_read on public.invoices for select to authenticated using(exists(select 1 from public.organization_members m where m.organization_id=invoices.organization_id and m.user_id=(select auth.uid())));
create policy invoice_lines_read on public.invoice_lines for select to authenticated using(exists(select 1 from public.invoices i join public.organization_members m on m.organization_id=i.organization_id where i.id=invoice_id and m.user_id=(select auth.uid())));
create policy payments_read on public.payment_transactions for select to authenticated using(exists(select 1 from public.organization_members m where m.organization_id=payment_transactions.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin')));
create policy revenue_read on public.revenue_events for select to authenticated using(exists(select 1 from public.organization_members m where m.organization_id=revenue_events.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin')));
create policy service_cases_read on public.service_cases for select to authenticated using(exists(select 1 from public.organization_members m where m.organization_id=service_cases.organization_id and m.user_id=(select auth.uid())));
create policy case_tasks_read on public.case_tasks for select to authenticated using(exists(select 1 from public.service_cases c join public.organization_members m on m.organization_id=c.organization_id where c.id=case_id and m.user_id=(select auth.uid())));
create policy docket_read on public.docket_deadlines for select to authenticated using(exists(select 1 from public.organization_members m where m.organization_id=docket_deadlines.organization_id and m.user_id=(select auth.uid())));
create policy ownership_read on public.ownership_chain for select to authenticated using(exists(select 1 from public.ip_records r join public.organization_members m on m.organization_id=r.organization_id where r.id=record_id and m.user_id=(select auth.uid())));
create policy search_jobs_read on public.search_jobs for select to authenticated using(exists(select 1 from public.organization_members m where m.organization_id=search_jobs.organization_id and m.user_id=(select auth.uid())));
create policy search_results_read on public.search_results for select to authenticated using(exists(select 1 from public.search_jobs j join public.organization_members m on m.organization_id=j.organization_id where j.id=search_job_id and m.user_id=(select auth.uid())));
