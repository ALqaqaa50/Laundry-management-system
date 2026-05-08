/**
 * Storage abstraction for quote requests.
 *
 * Routing logic:
 *   SUPABASE_ENABLED=true  → Supabase (postgres table + service role key)
 *   otherwise              → local JSON file  (data/quote-requests.json)
 *
 * All five public functions are provider-agnostic; callers never import
 * Supabase directly.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { QuoteRecord, QuoteStatus } from '@/app/api/quote/route';

// ── helpers ────────────────────────────────────────────────────────────────────

function isSupabaseEnabled(): boolean {
  return (
    process.env.SUPABASE_ENABLED === 'true' &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Lazy singleton — only imported when Supabase is enabled so the SDK is never
// bundled into deployments that don't need it.
let _supabase: import('@supabase/supabase-js').SupabaseClient | null = null;

async function getSupabaseAdmin() {
  if (_supabase) return _supabase;
  const { createClient } = await import('@supabase/supabase-js');
  _supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  return _supabase;
}

// ── Local JSON helpers ─────────────────────────────────────────────────────────

const DATA_FILE = path.join(process.cwd(), 'data', 'quote-requests.json');

async function localRead(): Promise<QuoteRecord[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as QuoteRecord[];
  } catch {
    return [];
  }
}

async function localWrite(records: QuoteRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

// ── Column mapper  (QuoteRecord ↔ Supabase row) ───────────────────────────────

function toRow(r: QuoteRecord): Record<string, unknown> {
  return {
    request_id:        r.requestId,
    source:            r.source,
    status:            r.status,
    customer_name:     r.customerName,
    phone:             r.phone,
    city:              r.city,
    device_type:       r.deviceType,
    brand:             r.deviceBrand,
    model:             r.deviceModel,
    part_id:           r.partId,
    part_name_ar:      r.partNameAR,
    part_name_en:      r.partNameEN,
    part_number:       r.partNumber,
    fault_description: r.faultDescription,
    symptoms:          r.symptoms,
    notes:             r.notes,
    images:            r.images,
    nameplate_images:  r.nameplateImages,
    created_at:        r.createdAt,
    updated_at:        r.updatedAt ?? null,
  };
}

function fromRow(row: Record<string, unknown>): QuoteRecord {
  return {
    requestId:        row.request_id as string,
    source:           row.source as QuoteRecord['source'],
    status:           row.status as QuoteStatus,
    customerName:     row.customer_name as string,
    phone:            row.phone as string,
    city:             (row.city as string | null) ?? null,
    deviceType:       (row.device_type as string | null) ?? null,
    deviceBrand:      (row.brand as string | null) ?? null,
    deviceModel:      (row.model as string | null) ?? null,
    partId:           (row.part_id as string | null) ?? null,
    partNameAR:       (row.part_name_ar as string | null) ?? null,
    partNameEN:       (row.part_name_en as string | null) ?? null,
    partNumber:       (row.part_number as string | null) ?? null,
    faultDescription: (row.fault_description as string | null) ?? null,
    symptoms:         (row.symptoms as string[]) ?? [],
    notes:            (row.notes as string | null) ?? null,
    images:           (row.images as QuoteRecord['images']) ?? [],
    nameplateImages:  (row.nameplate_images as QuoteRecord['nameplateImages']) ?? [],
    createdAt:        row.created_at as string,
    updatedAt:        (row.updated_at as string | undefined) ?? undefined,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function createQuoteRequest(record: QuoteRecord): Promise<void> {
  if (isSupabaseEnabled()) {
    const db = await getSupabaseAdmin();
    const { error } = await db.from('quote_requests').insert(toRow(record));
    if (error) throw new Error(`[Supabase] createQuoteRequest: ${error.message}`);
    return;
  }

  const records = await localRead();
  records.push(record);
  await localWrite(records);
}

export async function getAllQuoteRequests(): Promise<QuoteRecord[]> {
  if (isSupabaseEnabled()) {
    const db = await getSupabaseAdmin();
    const { data, error } = await db
      .from('quote_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`[Supabase] getAllQuoteRequests: ${error.message}`);
    return (data ?? []).map((r) => fromRow(r as Record<string, unknown>));
  }

  const records = await localRead();
  return [...records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getQuoteRequestById(requestId: string): Promise<QuoteRecord | null> {
  if (isSupabaseEnabled()) {
    const db = await getSupabaseAdmin();
    const { data, error } = await db
      .from('quote_requests')
      .select('*')
      .eq('request_id', requestId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      throw new Error(`[Supabase] getQuoteRequestById: ${error.message}`);
    }
    return data ? fromRow(data as Record<string, unknown>) : null;
  }

  const records = await localRead();
  return records.find((r) => r.requestId === requestId) ?? null;
}

export async function updateQuoteRequestStatus(
  requestId: string,
  status: QuoteStatus,
): Promise<QuoteRecord | null> {
  const updatedAt = new Date().toISOString();

  if (isSupabaseEnabled()) {
    const db = await getSupabaseAdmin();
    const { data, error } = await db
      .from('quote_requests')
      .update({ status, updated_at: updatedAt })
      .eq('request_id', requestId)
      .select()
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`[Supabase] updateQuoteRequestStatus: ${error.message}`);
    }
    return data ? fromRow(data as Record<string, unknown>) : null;
  }

  const records = await localRead();
  const idx = records.findIndex((r) => r.requestId === requestId);
  if (idx === -1) return null;
  records[idx] = { ...records[idx], status, updatedAt };
  await localWrite(records);
  return records[idx];
}

export async function getPublicTrackingInfo(requestId: string): Promise<{
  requestId: string;
  status: QuoteStatus;
  source: string;
  createdAt: string;
} | null> {
  if (isSupabaseEnabled()) {
    const db = await getSupabaseAdmin();
    const { data, error } = await db
      .from('quote_requests')
      .select('request_id, status, source, created_at')
      .eq('request_id', requestId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`[Supabase] getPublicTrackingInfo: ${error.message}`);
    }
    if (!data) return null;
    const row = data as Record<string, unknown>;
    return {
      requestId: row.request_id as string,
      status:    row.status as QuoteStatus,
      source:    row.source as string,
      createdAt: row.created_at as string,
    };
  }

  const record = await getQuoteRequestById(requestId);
  if (!record) return null;
  return {
    requestId: record.requestId,
    status:    record.status,
    source:    record.source,
    createdAt: record.createdAt,
  };
}
