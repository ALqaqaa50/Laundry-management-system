// ⚠️ MVP LOCAL STORAGE — saves files to public/uploads/quote-requests/ on the local filesystem.
// In production (Azure App Service, etc.) this directory is ephemeral and NOT shared across
// instances or redeployments. Replace with Azure Blob Storage before going live.

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { ImageMeta } from '@/types';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'quote-requests');
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 5;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

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
        {
          success: false,
          error: `نوع الملف "${file.name}" غير مسموح. الأنواع المقبولة: JPG, JPEG, PNG, WEBP`,
        },
        { status: 422 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `حجم الصورة "${file.name}" يتجاوز الحد الأقصى (5MB)`,
        },
        { status: 422 },
      );
    }
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const uploadedAt = new Date().toISOString();
  const results: ImageMeta[] = [];

  for (const file of files) {
    const ext = file.name.split('.').pop()!.toLowerCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const storedName = `upload-${Date.now()}-${rand}.${ext}`;

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
    });
  }

  return NextResponse.json({ success: true, files: results });
}
