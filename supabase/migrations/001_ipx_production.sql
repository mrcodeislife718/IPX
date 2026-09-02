create extension if not exists pgcrypto;

create type public.ip_asset_type as enum ('patent','design','trademark','copyright','trade_secret','research','software','other');
create type public.ip_record_status as enum ('draft','evidence_locked','under_review','filed','pending','issued','registered','maintained','challenged','revoked','expired','abandoned','transferred');
create type public.ip_event_kind as enum ('created','evidence_added','ownership_asserted','ownership_changed','reviewed','filed','status_changed','office_action','response','amended','certificate_issued','verified','challenged','revoked','renewed','licensed','transferred','commercialized');
create type public.billing_status as enum ('pending','active','past_due','cancelled','refunded');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','professional','examiner','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);

create table public.ip_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_type public.ip_asset_type not null,
  title text not null,
  description text,
  jurisdiction text not null default 'US',
  status public.ip_record_status not null default 'draft',
  owner_user_id uuid not null references auth.users(id),
  canonical_hash text,
  record_version bigint not null default 1,
  public_verification_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ip_records_org_idx on public.ip_records(organization_id, created_at desc);
create index ip_records_hash_idx on public.ip_records(canonical_hash) where canonical_hash is not null;

create table public.ip_parties (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.ip_records(id) on delete cascade,
  party_kind text not null check (party_kind in ('inventor','author','creator','claimant','assignee','owner','contributor','attorney','agent','examiner','licensee','licensor')),
  display_name text not null,
  external_identifier text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.ip_records(id) on delete cascade,
  submitted_by uuid not null references auth.users(id),
  content_hash text not null,
  storage_bucket text not null,
  storage_path text not null,
  media_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  encrypted boolean not null default true,
  timestamp_provider text,
  timestamp_receipt jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(record_id, content_hash)
);

create table public.ip_events (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.ip_records(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  event_kind public.ip_event_kind not null,
  authority text not null default 'ipx-private',
  payload jsonb not null default '{}'::jsonb,
  previous_event_hash text,
  event_hash text not null,
  created_at timestamptz not null default now(),
  unique(record_id,event_hash)
);
create index ip_events_record_idx on public.ip_events(record_id, created_at);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.ip_records(id) on delete cascade,
  cert_id text not null unique,
  certificate_hash text not null,
  policy_version text not null,
  key_fingerprint text,
  status text not null check (status in ('valid','superseded','revoked','expired')),
  issued_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table public.fee_catalog (
  id uuid primary key default gen_random_uuid(),
  authority text not null,
  service_code text not null,
  description text not null,
  entity_tier text not null check (entity_tier in ('regular','small','micro','not_applicable')),
  amount_cents bigint not null check (amount_cents >= 0),
  currency text not null default 'USD',
  source_url text not null,
  source_revision text not null,
  effective_from date not null,
  effective_to date,
  verified_at timestamptz not null,
  unique(authority,service_code,entity_tier,effective_from)
);
create index fee_catalog_current_idx on public.fee_catalog(authority,service_code,entity_tier,effective_from desc);

create table public.price_quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  service_code text not null,
  entity_tier text not null,
  base_fee_cents bigint not null,
  value_add_cents bigint not null default 0,
  total_cents bigint generated always as (base_fee_cents + value_add_cents) stored,
  currency text not null default 'USD',
  fee_catalog_id uuid references public.fee_catalog(id),
  quote_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  quote_id uuid not null references public.price_quotes(id),
  stripe_customer_id text,
  stripe_payment_intent_id text unique,
  status public.billing_status not null default 'pending',
  amount_cents bigint not null,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.idempotency_keys (
  key text primary key,
  user_id uuid references auth.users(id),
  request_hash text not null,
  response_status integer,
  response_body jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid,
  user_id uuid,
  action text not null,
  target_type text not null,
  target_id text,
  ip_address inet,
  user_agent text,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_org_idx on public.audit_log(organization_id,created_at desc);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.ip_records enable row level security;
alter table public.ip_parties enable row level security;
alter table public.evidence_items enable row level security;
alter table public.ip_events enable row level security;
alter table public.certificates enable row level security;
alter table public.fee_catalog enable row level security;
alter table public.price_quotes enable row level security;
alter table public.orders enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.audit_log enable row level security;

create policy organizations_select on public.organizations for select to authenticated using (exists (select 1 from public.organization_members m where m.organization_id=id and m.user_id=(select auth.uid())));
create policy organizations_insert on public.organizations for insert to authenticated with check (created_by=(select auth.uid()));
create policy members_select on public.organization_members for select to authenticated using (user_id=(select auth.uid()) or exists (select 1 from public.organization_members me where me.organization_id=organization_id and me.user_id=(select auth.uid()) and me.role in ('owner','admin')));
create policy records_select on public.ip_records for select to authenticated using (exists (select 1 from public.organization_members m where m.organization_id=organization_id and m.user_id=(select auth.uid())));
create policy records_insert on public.ip_records for insert to authenticated with check (owner_user_id=(select auth.uid()) and exists (select 1 from public.organization_members m where m.organization_id=organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin','professional','member')));
create policy records_update on public.ip_records for update to authenticated using (exists (select 1 from public.organization_members m where m.organization_id=organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin','professional'))) with check (exists (select 1 from public.organization_members m where m.organization_id=organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin','professional')));
create policy evidence_select on public.evidence_items for select to authenticated using (exists (select 1 from public.ip_records r join public.organization_members m on m.organization_id=r.organization_id where r.id=record_id and m.user_id=(select auth.uid())));
create policy evidence_insert on public.evidence_items for insert to authenticated with check (submitted_by=(select auth.uid()) and exists (select 1 from public.ip_records r join public.organization_members m on m.organization_id=r.organization_id where r.id=record_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin','professional','member')));
create policy events_select on public.ip_events for select to authenticated using (exists (select 1 from public.ip_records r join public.organization_members m on m.organization_id=r.organization_id where r.id=record_id and m.user_id=(select auth.uid())));
create policy parties_select on public.ip_parties for select to authenticated using (exists (select 1 from public.ip_records r join public.organization_members m on m.organization_id=r.organization_id where r.id=record_id and m.user_id=(select auth.uid())));
create policy cert_select on public.certificates for select to authenticated using (exists (select 1 from public.ip_records r join public.organization_members m on m.organization_id=r.organization_id where r.id=record_id and m.user_id=(select auth.uid())));
create policy fee_catalog_read on public.fee_catalog for select to authenticated using (true);
create policy quotes_select on public.price_quotes for select to authenticated using (user_id=(select auth.uid()));
create policy quotes_insert on public.price_quotes for insert to authenticated with check (user_id=(select auth.uid()));
create policy orders_select on public.orders for select to authenticated using (user_id=(select auth.uid()));
create policy idem_owner on public.idempotency_keys for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy audit_select on public.audit_log for select to authenticated using (exists (select 1 from public.organization_members m where m.organization_id=audit_log.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin')));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('ipx-evidence','ipx-evidence',false,104857600,null)
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit;

create policy evidence_objects_select on storage.objects for select to authenticated using (bucket_id='ipx-evidence' and exists (select 1 from public.evidence_items e join public.ip_records r on r.id=e.record_id join public.organization_members m on m.organization_id=r.organization_id where e.storage_path=name and m.user_id=(select auth.uid())));
create policy evidence_objects_insert on storage.objects for insert to authenticated with check (bucket_id='ipx-evidence');
