import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { requireEnv, bearerToken, readBody, jsonResponse, requestId, clientIp, safeText, safeSlug, safeUuid, sha256, stableJson } from './security.js';
import { ASSET_TYPES, recordHash, eventHash } from './core.js';
import { buildParityQuote } from './pricing.js';
import { normalizeObservation, scorePotentialMisuse, shouldAlert, buildEvidenceSnapshot } from './watchdog.js';
import { buildEvidenceStoragePath, evidenceManifest, validateUploadMetadata } from './evidence.js';

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

function httpError(message, statusCode) { return Object.assign(new Error(message), { statusCode }); }
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
  if (!token) throw httpError('Authentication required', 401);
  const { data, error } = await publicClient.auth.getUser(token);
  if (error || !data?.user) throw httpError('Invalid or expired token', 401);
  return { user: data.user, token };
}

async function jsonBody(req) {
  const raw = await readBody(req, BODY_LIMIT);
  if (!raw.length) return {};
  try { return JSON.parse(raw.toString('utf8')); }
  catch { throw httpError('Invalid JSON', 400); }
}

async function audit({ organizationId = null, userId = null, action, targetType, targetId = null, req, rid, metadata = {} }) {
  const { error } = await admin.from('audit_log').insert({ organization_id: organizationId, user_id: userId, action, target_type: targetType, target_id: targetId, ip_address: clientIp(req), user_agent: req.headers['user-agent'] || null, request_id: rid, metadata });
  if (error) throw error;
}

async function requireMembership(userId, organizationId, roles = null) {
  const { data, error } = await admin.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data || (roles && !roles.includes(data.role))) throw httpError('Insufficient organization authority', 403);
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
  if (!ASSET_TYPES.has(body.asset_type)) throw httpError('Unsupported asset type', 400);
  const input = { asset_type: body.asset_type, title: safeText(body.title, { min: 1, max: 500 }), description: body.description ? safeText(body.description, { min: 1, max: 20000 }) : null, jurisdiction: body.jurisdiction ? safeText(body.jurisdiction, { min: 2, max: 64 }) : 'US', parties: Array.isArray(body.parties) ? body.parties : [] };
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

async function createEvidenceUpload(req, res, rid, user) {
  const body = await jsonBody(req);
  const recordId = safeUuid(body.record_id);
  const meta = validateUploadMetadata({ filename: body.filename, mediaType: body.media_type, byteSize: body.byte_size });
  const { data: record, error } = await admin.from('ip_records').select('id,organization_id').eq('id', recordId).single();
  if (error || !record) throw httpError('IP record not found', 404);
  await requireMembership(user.id, record.organization_id, ['owner','admin','professional','member']);
  const uploadId = randomUUID();
  const storagePath = buildEvidenceStoragePath({ organizationId: record.organization_id, recordId, evidenceId: uploadId, filename: meta.filename });
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const { data: signed, error: signedError } = await admin.storage.from('ipx-evidence').createSignedUploadUrl(storagePath);
  if (signedError) throw signedError;
  const { data: session, error: sessionError } = await admin.from('evidence_upload_sessions').insert({ id: uploadId, organization_id: record.organization_id, record_id: recordId, user_id: user.id, storage_path: storagePath, filename: meta.filename, media_type: meta.mediaType, expected_byte_size: meta.byteSize, expires_at: expiresAt }).select().single();
  if (sessionError) throw sessionError;
  await audit({ organizationId: record.organization_id, userId: user.id, action: 'evidence.upload_authorized', targetType: 'evidence_upload_session', targetId: session.id, req, rid, metadata: { record_id: recordId, byte_size: meta.byteSize } });
  return jsonResponse(res, 201, { upload_session_id: session.id, storage_path: storagePath, signed_upload: signed, expires_at: expiresAt, request_id: rid });
}

async function finalizeEvidenceUpload(req, res, rid, user) {
  const body = await jsonBody(req);
  const uploadId = safeUuid(body.upload_session_id);
  const contentHash = safeText(body.content_hash, { min: 64, max: 64 }).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(contentHash)) throw httpError('content_hash must be SHA-256 hex', 400);
  const { data: session, error } = await admin.from('evidence_upload_sessions').select('*').eq('id', uploadId).eq('user_id', user.id).single();
  if (error || !session) throw httpError('Upload session not found', 404);
  if (session.status !== 'pending') throw httpError('Upload session is not pending', 409);
  if (new Date(session.expires_at) <= new Date()) throw httpError('Upload session expired', 410);
  await requireMembership(user.id, session.organization_id, ['owner','admin','professional','member']);
  const { data: objects, error: listError } = await admin.storage.from('ipx-evidence').list(session.storage_path.split('/').slice(0,-1).join('/'), { search: session.storage_path.split('/').at(-1), limit: 10 });
  if (listError) throw listError;
  const object = objects?.find(x => x.name === session.storage_path.split('/').at(-1));
  if (!object) throw httpError('Uploaded object not found', 409);
  if (object.metadata?.size != null && Number(object.metadata.size) !== Number(session.expected_byte_size)) throw httpError('Uploaded object size does not match authorization', 409);
  const manifest = evidenceManifest({ recordId: session.record_id, submittedBy: user.id, contentHash, mediaType: session.media_type, byteSize: session.expected_byte_size, storagePath: session.storage_path, timestampProvider: body.timestamp_provider || null, timestampReceipt: body.timestamp_receipt || null, metadata: { ...(body.metadata || {}), upload_session_id: session.id } });
  const { data: evidence, error: evidenceError } = await admin.from('evidence_items').insert({ record_id: session.record_id, submitted_by: user.id, content_hash: manifest.content_hash, storage_bucket: 'ipx-evidence', storage_path: session.storage_path, media_type: manifest.media_type, byte_size: manifest.byte_size, encrypted: true, timestamp_provider: manifest.timestamp_provider, timestamp_receipt: manifest.timestamp_receipt, metadata: { ...manifest.metadata, manifest_hash: manifest.manifest_hash } }).select().single();
  if (evidenceError) throw evidenceError;
  const { error: updateError } = await admin.from('evidence_upload_sessions').update({ status: 'finalized', finalized_evidence_id: evidence.id, updated_at: new Date().toISOString() }).eq('id', session.id).eq('status','pending');
  if (updateError) throw updateError;
  await audit({ organizationId: session.organization_id, userId: user.id, action: 'evidence.finalized', targetType: 'evidence_item', targetId: evidence.id, req, rid, metadata: { record_id: session.record_id, manifest_hash: manifest.manifest_hash } });
  return jsonResponse(res, 201, { evidence, manifest_hash: manifest.manifest_hash, request_id: rid });
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
  if (!rows?.length) throw httpError('No current reference fee is available for this service', 404);
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
  if (error || !q) throw httpError('Quote not found', 404);
  if (new Date(q.expires_at) <= new Date()) throw httpError('Quote expired', 409);
  await requireMembership(user.id, q.organization_id);
  const session = await stripe.checkout.sessions.create({ mode: 'payment', success_url: `${process.env.IPX_PUBLIC_ORIGIN}/billing/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${process.env.IPX_PUBLIC_ORIGIN}/billing/cancel`, client_reference_id: q.id, customer_email: user.email || undefined, line_items: [{ quantity: 1, price_data: { currency: q.currency.toLowerCase(), unit_amount: q.total_cents, product_data: { name: `IPX ${q.service_code}`, description: 'Private IPX service. Government filing fees are separate unless explicitly stated.' } } }], metadata: { purchase_kind: 'service', quote_id: q.id, service_code: q.service_code, organization_id: q.organization_id, user_id: user.id } }, { idempotencyKey: `ipx-checkout-${q.quote_hash}` });
  const { error: orderError } = await admin.from('orders').insert({ organization_id: q.organization_id, user_id: user.id, quote_id: q.id, stripe_checkout_session_id: session.id, status: 'pending', amount_cents: q.total_cents, currency: q.currency });
  if (orderError) throw orderError;
  await audit({ organizationId: q.organization_id, userId: user.id, action: 'checkout.created', targetType: 'stripe_checkout_session', targetId: session.id, req, rid, metadata: { quote_id: q.id } });
  return jsonResponse(res, 201, { checkout_url: session.url, request_id: rid });
}

const WATCHDOG_TIERS = {
  individual: { amount: 1900, max_assets: 3, scan_interval_minutes: 1440 },
  professional: { amount: 7900, max_assets: 25, scan_interval_minutes: 360 },
  enterprise: { amount: 29900, max_assets: 250, scan_interval_minutes: 60 }
};

async function createWatchdogSubscription(req, res, rid, user) {
  const body = await jsonBody(req);
  const organizationId = safeUuid(body.organization_id);
  await requireMembership(user.id, organizationId, ['owner','admin','professional','member']);
  const tier = safeText(body.tier, { min: 3, max: 32 });
  const plan = WATCHDOG_TIERS[tier];
  if (!plan) throw httpError('Unsupported Watchdog tier', 400);
  const { data: row, error } = await admin.from('watchdog_subscriptions').insert({ organization_id: organizationId, user_id: user.id, tier, status: 'pending', max_assets: plan.max_assets, scan_interval_minutes: plan.scan_interval_minutes }).select().single();
  if (error) throw error;
  const session = await stripe.checkout.sessions.create({ mode: 'subscription', success_url: `${process.env.IPX_PUBLIC_ORIGIN}/watchdog/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${process.env.IPX_PUBLIC_ORIGIN}/watchdog/cancel`, customer_email: user.email || undefined, line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: plan.amount, recurring: { interval: 'month' }, product_data: { name: `IPX Watchdog ${tier}`, description: 'Continuous monitoring for possible IP misuse with evidence-preserving alerts.' } } }], metadata: { purchase_kind: 'watchdog', watchdog_subscription_id: row.id, organization_id: organizationId, user_id: user.id, tier } }, { idempotencyKey: `ipx-watchdog-${row.id}` });
  const { error: updateError } = await admin.from('watchdog_subscriptions').update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() }).eq('id', row.id);
  if (updateError) throw updateError;
  await audit({ organizationId, userId: user.id, action: 'watchdog.subscription_checkout_created', targetType: 'watchdog_subscription', targetId: row.id, req, rid, metadata: { tier } });
  return jsonResponse(res, 201, { subscription_id: row.id, checkout_url: session.url, tier, request_id: rid });
}

async function enrollWatchdogAsset(req, res, rid, user) {
  const body = await jsonBody(req);
  const subscriptionId = safeUuid(body.subscription_id);
  const recordId = safeUuid(body.record_id);
  const { data: sub, error } = await admin.from('watchdog_subscriptions').select('*').eq('id', subscriptionId).eq('user_id', user.id).single();
  if (error || !sub) throw httpError('Watchdog subscription not found', 404);
  if (sub.status !== 'active') throw httpError('Watchdog subscription is not active', 402);
  await requireMembership(user.id, sub.organization_id);
  const { data: record, error: recordError } = await admin.from('ip_records').select('id,organization_id').eq('id', recordId).single();
  if (recordError || !record || record.organization_id !== sub.organization_id) throw httpError('IP record not found in organization', 404);
  const { count, error: countError } = await admin.from('watchdog_assets').select('*', { count: 'exact', head: true }).eq('subscription_id', subscriptionId).eq('enabled', true);
  if (countError) throw countError;
  if (sub.max_assets != null && count >= sub.max_assets) throw httpError('Watchdog asset limit reached', 409);
  const terms = Array.isArray(body.watch_terms) ? body.watch_terms.map(x => safeText(x, { min: 1, max: 200 })).slice(0,100) : [];
  const { data: asset, error: assetError } = await admin.from('watchdog_assets').insert({ subscription_id: subscriptionId, record_id: recordId, watch_terms: terms, known_domains: Array.isArray(body.known_domains) ? body.known_domains.slice(0,100) : [], known_accounts: Array.isArray(body.known_accounts) ? body.known_accounts.slice(0,100) : [] }).select().single();
  if (assetError) throw assetError;
  await audit({ organizationId: sub.organization_id, userId: user.id, action: 'watchdog.asset_enrolled', targetType: 'watchdog_asset', targetId: asset.id, req, rid, metadata: { record_id: recordId } });
  return jsonResponse(res, 201, { asset, request_id: rid });
}

async function watchdogIngest(req, res, rid, user) {
  const body = await jsonBody(req);
  const assetId = safeUuid(body.asset_id);
  const { data: asset, error } = await admin.from('watchdog_assets').select('*,watchdog_subscriptions!inner(user_id,organization_id,status),ip_records!inner(canonical_hash)').eq('id', assetId).single();
  if (error || !asset) throw httpError('Watchdog asset not found', 404);
  if (asset.watchdog_subscriptions.user_id !== user.id) throw httpError('Not authorized', 403);
  if (asset.watchdog_subscriptions.status !== 'active') throw httpError('Watchdog subscription is not active', 402);
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

async function fulfillServiceCheckout(session) {
  const quoteId = session.metadata?.quote_id;
  if (!quoteId) return;
  const { data: order, error } = await admin.from('orders').select('*,price_quotes!inner(service_code)').eq('stripe_checkout_session_id', session.id).maybeSingle();
  if (error) throw error;
  if (!order || order.fulfilled_at) return;
  const now = new Date().toISOString();
  const { error: updateError } = await admin.from('orders').update({ status: 'active', stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null, fulfilled_at: now, updated_at: now }).eq('id', order.id).is('fulfilled_at', null);
  if (updateError) throw updateError;
  const { error: entitlementError } = await admin.from('service_entitlements').insert({ organization_id: order.organization_id, user_id: order.user_id, order_id: order.id, service_code: order.price_quotes.service_code, status: 'active', quantity: 1, metadata: { stripe_checkout_session_id: session.id } });
  if (entitlementError && entitlementError.code !== '23505') throw entitlementError;
}

async function fulfillWatchdogCheckout(session) {
  const subscriptionId = session.metadata?.watchdog_subscription_id;
  if (!subscriptionId) return;
  const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
  const { error } = await admin.from('watchdog_subscriptions').update({ status: 'active', stripe_subscription_id: stripeSubscriptionId, updated_at: new Date().toISOString() }).eq('id', subscriptionId).eq('stripe_checkout_session_id', session.id);
  if (error) throw error;
}

async function stripeWebhook(req, res, rid) {
  const raw = await readBody(req, BODY_LIMIT);
  const signature = req.headers['stripe-signature'];
  let event;
  try { event = stripe.webhooks.constructEvent(raw, signature, process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return jsonResponse(res, 400, { error: 'invalid_webhook_signature', request_id: rid }); }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.metadata?.purchase_kind === 'watchdog') await fulfillWatchdogCheckout(session);
    else await fulfillServiceCheckout(session);
  }
  if (['customer.subscription.updated','customer.subscription.deleted'].includes(event.type)) {
    const sub = event.data.object;
    const status = ['active','trialing'].includes(sub.status) ? 'active' : sub.status === 'past_due' ? 'past_due' : 'cancelled';
    const periodEnd = sub.items?.data?.[0]?.current_period_end ? new Date(sub.items.data[0].current_period_end * 1000).toISOString() : null;
    const { error } = await admin.from('watchdog_subscriptions').update({ status, current_period_end: periodEnd, cancel_at_period_end: Boolean(sub.cancel_at_period_end), updated_at: new Date().toISOString() }).eq('stripe_subscription_id', sub.id);
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
    if (req.method === 'POST' && url.pathname === '/v1/evidence/uploads') return await createEvidenceUpload(req, res, rid, user);
    if (req.method === 'POST' && url.pathname === '/v1/evidence/finalize') return await finalizeEvidenceUpload(req, res, rid, user);
    if (req.method === 'POST' && url.pathname === '/v1/quotes') return await quote(req, res, rid, user);
    if (req.method === 'POST' && url.pathname === '/v1/checkout') return await checkout(req, res, rid, user);
    if (req.method === 'POST' && url.pathname === '/v1/watchdog/subscriptions') return await createWatchdogSubscription(req, res, rid, user);
    if (req.method === 'POST' && url.pathname === '/v1/watchdog/assets') return await enrollWatchdogAsset(req, res, rid, user);
    if (req.method === 'POST' && url.pathname === '/v1/watchdog/observations') return await watchdogIngest(req, res, rid, user);
    return jsonResponse(res, 404, { error: 'not_found', request_id: rid });
  } catch (error) {
    console.error(JSON.stringify({ request_id: rid, error: error.message, stack: process.env.NODE_ENV === 'production' ? undefined : error.stack }));
    return jsonResponse(res, error.statusCode || 500, { error: error.statusCode ? error.message : 'internal_error', request_id: rid });
  }
});

server.listen(PORT, () => console.log(JSON.stringify({ event: 'ipx.server.started', port: PORT })));
