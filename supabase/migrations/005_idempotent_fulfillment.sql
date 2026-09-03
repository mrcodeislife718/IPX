create unique index if not exists service_entitlements_order_service_uq
  on public.service_entitlements(order_id, service_code)
  where order_id is not null;

create table public.webhook_events (
  provider text not null,
  event_id text not null,
  event_type text not null,
  status text not null default 'processing' check (status in ('processing','processed','failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  primary key (provider,event_id)
);
alter table public.webhook_events enable row level security;

create index if not exists evidence_upload_sessions_expiry_idx
  on public.evidence_upload_sessions(status,expires_at)
  where status='pending';
