/**
 * Image upload endpoint.
 *
 * Provider routing:
 *   SUPABASE_ENABLED=true  → Supabase Storage  (bucket: SUPABASE_STORAGE_BUCKET)
 *   otherwise              → local filesystem  (public/uploads/quote-requests/)
 *
 * The returned ImageMeta includes `storageProvider` so downstream code can
 * tell where a file lives without re-reading env vars.
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// We extend the shared ImageMeta type locally to add storageProvider.
// The base type lives in @/types; we widen it here without touching the
// shared definition so existing callers keep working unchanged.
export interface UploadedImageMeta {
  originalName: string;
  storedName: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  storageProvider: 'local' | 'supabase';
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'quote-requests');
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 5;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

function isSupabaseEnabled(): boolean {
  return (
    process.env.SUPABASE_ENABLED === 'true' &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function getSupabaseAdmin() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

function makeStoredName(originalName: string): string {
  const ext = originalName.split('.').pop()!.toLowerCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `upload-${Date.now()}-${rand}.${ext}`;
}

async function uploadToSupabase(
  files: File[],
  uploadedAt: string,
): Promise<UploadedImageMeta[]> {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'quote-images';
  const db = await getSupabaseAdmin();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const results: UploadedImageMeta[] = [];

  for (const file of files) {
    const storedName = makeStoredName(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await db.storage
      .from(bucket)
      .upload(storedName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) throw new Error(`[Supabase Storage] upload failed: ${error.message}`);

    const { data: publicData } = db.storage.from(bucket).getPublicUrl(storedName);

    results.push({
      originalName: file.name,
      storedName,
      url: publicData.publicUrl,
      size: file.size,
      type: file.type,
      uploadedAt,
      storageProvider: 'supabase',
    });
  }

  // suppress unused var warning
  void siteUrl;
  return results;
}

async function uploadToLocal(
  files: File[],
  uploadedAt: string,
): Promise<UploadedImageMeta[]> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const results: UploadedImageMeta[] = [];

  for (const file of files) {
    const storedName = makeStoredName(file.name);
    await fs.writeFile(
      path.join(UPLOAD_DIR, storedName),
      Buffer.from(await file.arrayBuffer()),
    );
    results.push({
      originalName: file.name,
      storedName,
      url: `/uploads/quote-requests/${storedName}`,
      size: file.size,
      type: file.type,
      uploadedAt,
      storageProvider: 'local',
    });
  }

  return results;
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: 'فشل قراءة البيانات المرسلة' },
      { status: 400 },
    );
  }

  const files = formData.getAll('files') as File[];

  if (files.length === 0) {
    return NextResponse.json(
      { success: false, error: 'لم يتم إرسال أي ملفات' },
      { status: 400 },
    );
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { success: false, error: `عدد الصور يتجاوز الحد المسموح (${MAX_FILES} صور كحد أقصى)` },
      { status: 422 },
    );
  }

  // Validate all files before writing anything
  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_MIME.has(file.type) || !ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        { success: false, error: `نوع الملف "${file.name}" غير مسموح. الأنواع المقبولة: JPG, PNG, WEBP` },
        { status: 422 },
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: `حجم الصورة "${file.name}" يتجاوز الحد الأقصى (5MB)` },
        { status: 422 },
      );
    }
  }

  const uploadedAt = new Date().toISOString();

  try {
    const results = isSupabaseEnabled()
      ? await uploadToSupabase(files, uploadedAt)
      : await uploadToLocal(files, uploadedAt);

    return NextResponse.json({ success: true, files: results });
  } catch (err) {
    console.error('[/api/upload]', err);
    return NextResponse.json(
      { success: false, error: 'فشل رفع الصور، حاول مجدداً' },
      { status: 500 },
    );
  }
}
