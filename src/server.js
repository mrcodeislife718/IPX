import http from 'node:http';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { requireEnv, bearerToken, readBody, jsonResponse, requestId, clientIp, safeText, safeSlug, safeUuid, sha256, stableJson } from './security.js';
import { ASSET_TYPES, recordHash, eventHash } from './core.js';
import { buildParityQuote } from './pricing.js';
import { normalizeObservation, scorePotentialMisuse, shouldAlert, buildEvidenceSnapshot } from './watchdog.js';

const REQUIRED = ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','IPX_PUBLIC_ORIGIN'];
requireEnv(REQUIRED);

const PORT = Number(process.env.PORT || 8080);
const BODY_LIMIT = Number(process.env.IPX_REQUEST_BODY_LIMIT_BYTES || 1048576);
const RATE_WINDOW = Number(process.env.IPX_RATE_LIMIT_WINDOW_MS || 60000);
const RATE_MAX = Number(process.env.IPX_RATE_LIMIT_MAX || 120);
const publicClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const rate = new Map();

function rateLimit(key) {
  const now = Date.now();
  const current = rate.get(key);
  if (!current || current.resetAt <= now) {
    rate.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_MAX - 1 };
  }
  current.count += 1;
  return { allowed: current.count <= RATE_MAX, remaining: Math.max(0, RATE_MAX - current.count), retryAfterMs: current.resetAt - now };
}

async function authUser(req) {
  const token = bearerToken(req.headers);
  if (!token) throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
  const { data, error } = await publicClient.auth.getUser(token);
  if (error || !data?.user) throw Object.assign(new Error('Invalid or expired token'), { statusCode: 401 });
  return { user: data.user, token };
}

async function jsonBody(req) {
  const raw = await readBody(req, BODY_LIMIT);
  if (!raw.length) return {};
  try { return JSON.parse(raw.toString('utf8')); }
  catch { throw Object.assign(new Error('Invalid JSON'), { statusCode: 400 }); }
}

async function audit({ organizationId = null, userId = null, action, targetType, targetId = null, req, rid, metadata = {} }) {
  const { error } = await admin.from('audit_log').insert({ organization_id: organizationId, user_id: userId, action, target_type: targetType, target_id: targetId, ip_address: clientIp(req), user_agent: req.headers['user-agent'] || null, request_id: rid, metadata });
  if (error) throw error;
}

async function requireMembership(userId, organizationId, roles = null) {
  const { data, error } = await admin.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data || (roles && !roles.includes(data.role))) throw Object.assign(new Error('Insufficient organization authority'), { statusCode: 403 });
  return data.role;
}

async function createOrganization(req, res, rid, user) {
  const body = await jsonBody(req);
  const name = safeText(body.name, { min: 2, max: 200 });
  const slug = safeSlug(body.slug);
  const { data: org, error } = await admin.from('organizations').insert({ name, slug, created_by: user.id }).select().single();
  if (error) throw error;
  const { error: memberError } = await admin.from('organization_members').insert({ organization_id: org.id, user_id: user.id, role: 'owner' });
  if (memberError) throw memberError;
  await audit({ organizationId: org.id, userId: user.id, action: 'organization.created', targetType: 'organization', targetId: org.id, req, rid });
  return jsonResponse(res, 201, { organization: org, request_id: rid });
}

async function createRecord(req, res, rid, user) {
  const body = await jsonBody(req);
  const organizationId = safeUuid(body.organization_id);
  await requireMembership(user.id, organizationId, ['owner','admin','professional','member']);
  if (!ASSET_TYPES.has(body.asset_type)) throw Object.assign(new Error('Unsupported asset type'), { statusCode: 400 });
  const input = {
    asset_type: body.asset_type,
    title: safeText(body.title, { min: 1, max: 500 }),
    description: body.description ? safeText(body.description, { min: 1, max: 20000 }) : null,
    jurisdiction: body.jurisdiction ? safeText(body.jurisdiction, { min: 2, max: 64 }) : 'US',
    parties: Array.isArray(body.parties) ? body.parties : []
  };
  const canonicalHash = recordHash(input);
  const { data: record, error } = await admin.from('ip_records').insert({ organization_id: organizationId, asset_type: input.asset_type, title: input.title, description: input.description, jurisdiction: input.jurisdiction, owner_user_id: user.id, canonical_hash: canonicalHash }).select().single();
  if (error) throw error;
  const createdAt = new Date().toISOString();
  const hash = eventHash({ recordId: record.id, kind: 'created', payload: { canonical_hash: canonicalHash }, actorUserId: user.id, authority: 'ipx-private', createdAt });
  const { error: eventError } = await admin.from('ip_events').insert({ record_id: record.id, actor_user_id: user.id, event_kind: 'created', authority: 'ipx-private', payload: { canonical_hash: canonicalHash }, previous_event_hash: null, event_hash: hash, created_at: createdAt });
  if (eventError) throw eventError;
  await audit({ organizationId, userId: user.id, action: 'ip_record.created', targetType: 'ip_record', targetId: record.id, req, rid, metadata: { asset_type: record.asset_type } });
  return jsonResponse(res, 201, { record, request_id: rid });
}

async function quote(req, res, rid, user) {
  const body = await jsonBody(req);
  const organizationId = safeUuid(body.organization_id);
  await requireMembership(user.id, organizationId);
  const serviceCode = safeText(body.service_code, { min: 2, max: 120 });
  const entityTier = safeText(body.entity_tier || 'not_applicable', { min: 3, max: 32 });
  const today = new Date().toISOString().slice(0,10);
  const { data: rows, error } = await admin.from('fee_catalog').select('*').eq('service_code', serviceCode).eq('entity_tier', entityTier).lte('effective_from', today).or(`effective_to.is.null,effective_to.gte.${today}`).order('effective_from', { ascending: false }).limit(1);
  if (error) throw error;
  if (!rows?.length) throw Object.assign(new Error('No current reference fee is available for this service'), { statusCode: 404 });
  const built = buildParityQuote({ referenceFee: rows[0], organizationId, userId: user.id, serviceCode, entityTier, includedValue: body.included_value || ['IPX provenance record','private lifecycle record','audit trail','exportable verification package'], optionalAddOns: body.optional_add_ons || [] });
  const { data: stored, error: storeError } = await admin.from('price_quotes').insert({ organization_id: organizationId, user_id: user.id, service_code: serviceCode, entity_tier: entityTier, base_fee_cents: built.base_fee_cents, value_add_cents: built.optional_add_on_cents, currency: built.currency, fee_catalog_id: rows[0].id, quote_hash: built.quote_hash, expires_at: built.expires_at }).select().single();
  if (storeError) throw storeError;
  await audit({ organizationId, userId: user.id, action: 'quote.created', targetType: 'price_quote', targetId: stored.id, req, rid, metadata: { service_code: serviceCode, pricing_model: built.pricing_model } });
  return jsonResponse(res, 201, { quote: { ...built, id: stored.id }, request_id: rid });
}

async function checkout(req, res, rid, user) {
  const body = await jsonBody(req);
  const quoteId = safeUuid(body.quote_id);
  const { data: q, error } = await admin.from('price_quotes').select('*').eq('id', quoteId).eq('user_id', user.id).single();
  if (error || !q) throw Object.assign(new Error('Quote not found'), { statusCode: 404 });
  if (new Date(q.expires_at) <= new Date()) throw Object.assign(new Error('Quote expired'), { statusCode: 409 });
  await requireMembership(user.id, q.organization_id);
  const session = await stripe.checkout.sessions.create({ mode: 'payment', success_url: `${process.env.IPX_PUBLIC_ORIGIN}/billing/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${process.env.IPX_PUBLIC_ORIGIN}/billing/cancel`, client_reference_id: q.id, customer_email: user.email || undefined, line_items: [{ quantity: 1, price_data: { currency: q.currency.toLowerCase(), unit_amount: q.total_cents, product_data: { name: `IPX ${q.service_code}`, description: 'Private IPX service. Government filing fees are not included unless separately stated.' } } }], metadata: { quote_id: q.id, organization_id: q.organization_id, user_id: user.id } }, { idempotencyKey: `ipx-checkout-${q.quote_hash}` });
  const { error: orderError } = await admin.from('orders').insert({ organization_id: q.organization_id, user_id: user.id, quote_id: q.id, stripe_checkout_session_id: session.id, status: 'pending', amount_cents: q.total_cents, currency: q.currency });
  if (orderError) throw orderError;
  await audit({ organizationId: q.organization_id, userId: user.id, action: 'checkout.created', targetType: 'stripe_checkout_session', targetId: session.id, req, rid, metadata: { quote_id: q.id } });
  return jsonResponse(res, 201, { checkout_url: session.url, request_id: rid });
}

async function watchdogIngest(req, res, rid, user) {
  const body = await jsonBody(req);
  const assetId = safeUuid(body.asset_id);
  const { data: asset, error } = await admin.from('watchdog_assets').select('*,watchdog_subscriptions!inner(user_id,organization_id,status),ip_records!inner(canonical_hash)').eq('id', assetId).single();
  if (error || !asset) throw Object.assign(new Error('Watchdog asset not found'), { statusCode: 404 });
  if (asset.watchdog_subscriptions.user_id !== user.id) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  const observation = normalizeObservation(body.observation || {});
  const score = scorePotentialMisuse(body.signals || {});
  const snapshot = buildEvidenceSnapshot({ observation, score, assetRecordHash: asset.ip_records.canonical_hash });
  const scanFingerprint = sha256(stableJson({ assetId, observation: observation.content_hash, at: new Date().toISOString().slice(0,13) }));
  const { data: scan, error: scanError } = await admin.from('watchdog_scans').insert({ asset_id: assetId, status: 'complete', request_fingerprint: scanFingerprint, result_count: 1, completed_at: new Date().toISOString(), metadata: { ingestion: 'authenticated-observation' } }).select().single();
  if (scanError) throw scanError;
  const { data: match, error: matchError } = await admin.from('watchdog_matches').upsert({ scan_id: scan.id, asset_id: assetId, source_kind: observation.source_kind, source_url: observation.source_url, observed_at: observation.observed_at, title: observation.title, excerpt: observation.excerpt, content_hash: observation.content_hash, similarity_score: score.similarity_score, provenance_score: score.provenance_score, legal_risk_score: score.legal_risk_score, confidence_score: score.confidence_score, rationale: { score, evidence_hash: snapshot.evidence_hash } }, { onConflict: 'asset_id,source_url,content_hash' }).select().single();
  if (matchError) throw matchError;
  if (shouldAlert(score)) {
    const { error: alertError } = await admin.from('watchdog_alerts').insert({ match_id: match.id, organization_id: asset.watchdog_subscriptions.organization_id, channel: 'in_app', delivery_status: 'pending', metadata: { severity: score.severity } });
    if (alertError) throw alertError;
  }
  await audit({ organizationId: asset.watchdog_subscriptions.organization_id, userId: user.id, action: 'watchdog.match_recorded', targetType: 'watchdog_match', targetId: match.id, req, rid, metadata: { severity: score.severity, confidence: score.confidence_score } });
  return jsonResponse(res, 201, { match, score, alert_created: shouldAlert(score), evidence_hash: snapshot.evidence_hash, request_id: rid });
}

async function stripeWebhook(req, res, rid) {
  const raw = await readBody(req, BODY_LIMIT);
  const signature = req.headers['stripe-signature'];
  let event;
  try { event = stripe.webhooks.constructEvent(raw, signature, process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return jsonResponse(res, 400, { error: 'invalid_webhook_signature', request_id: rid }); }
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    const { error } = await admin.from('orders').update({ status: 'active', stripe_payment_intent_id: typeof s.payment_intent === 'string' ? s.payment_intent : null, updated_at: new Date().toISOString() }).eq('stripe_checkout_session_id', s.id);
    if (error) throw error;
  }
  return jsonResponse(res, 200, { received: true, request_id: rid });
}

const server = http.createServer(async (req, res) => {
  const rid = requestId(req.headers);
  const key = clientIp(req) || 'unknown';
  const rl = rateLimit(key);
  if (!rl.allowed) return jsonResponse(res, 429, { error: 'rate_limited', request_id: rid }, { 'retry-after': String(Math.ceil(rl.retryAfterMs / 1000)) });
  try {
    const url = new URL(req.url, 'http://ipx.local');
    if (req.method === 'GET' && url.pathname === '/health') return jsonResponse(res, 200, { ok: true, service: 'ipx', mode: 'private-modern-patent-office', request_id: rid });
    if (req.method === 'POST' && url.pathname === '/webhooks/stripe') return await stripeWebhook(req, res, rid);
    const { user } = await authUser(req);
    if (req.method === 'POST' && url.pathname === '/v1/organizations') return await createOrganization(req, res, rid, user);
    if (req.method === 'POST' && url.pathname === '/v1/ip-records') return await createRecord(req, res, rid, user);
    if (req.method === 'POST' && url.pathname === '/v1/quotes') return await quote(req, res, rid, user);
    if (req.method === 'POST' && url.pathname === '/v1/checkout') return await checkout(req, res, rid, user);
    if (req.method === 'POST' && url.pathname === '/v1/watchdog/observations') return await watchdogIngest(req, res, rid, user);
    return jsonResponse(res, 404, { error: 'not_found', request_id: rid });
  } catch (error) {
    console.error(JSON.stringify({ request_id: rid, error: error.message, stack: process.env.NODE_ENV === 'production' ? undefined : error.stack }));
    return jsonResponse(res, error.statusCode || 500, { error: error.statusCode ? error.message : 'internal_error', request_id: rid });
  }
});

server.listen(PORT, () => console.log(JSON.stringify({ event: 'ipx.server.started', port: PORT })));
