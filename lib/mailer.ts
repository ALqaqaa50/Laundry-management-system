// Email notification helper — uses nodemailer with SMTP.
// Required env vars: ADMIN_EMAIL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// Optional:         NEXT_PUBLIC_SITE_URL (for clickable admin link and image URLs in email)
//
// If any required SMTP var is missing the function logs a warning and returns without throwing.
// The caller should fire-and-forget (.catch) so email failures never block the user request.

import nodemailer from 'nodemailer';
import type { QuoteRecord } from '@/app/api/quote/route';

const SOURCE_LABELS: Record<string, string> = {
  'quote-form':        'نموذج السعر',
  'unknown-part-form': 'قطعة مجهولة',
};

const DEVICE_LABELS: Record<string, string> = {
  'washer-extractor': 'غسالة استخراج',
  'tumble-dryer':     'مجفف',
  ironer:             'كالندر / مكواة',
  boiler:             'بويلر',
  'steam-generator':  'مولد بخار',
  'dry-cleaning':     'تنظيف جاف',
};

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP config incomplete — set SMTP_HOST, SMTP_USER, SMTP_PASS');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 16px;background:#f8fafc;font-weight:600;color:#374151;
                 border-bottom:1px solid #e2e8f0;white-space:nowrap;width:160px;">${label}</td>
      <td style="padding:10px 16px;color:#1e293b;border-bottom:1px solid #e2e8f0;">${value}</td>
    </tr>`;
}

function buildHtml(record: QuoteRecord, siteUrl: string): string {
  const totalImages = record.images.length + record.nameplateImages.length;

  const imageLinksHtml =
    totalImages === 0
      ? 'لا توجد صور'
      : [
          ...record.images.map(
            (img, i) =>
              `<a href="${siteUrl}${img.url}" style="color:#2563eb;">صورة القطعة ${i + 1}</a>`,
          ),
          ...record.nameplateImages.map(
            (img, i) =>
              `<a href="${siteUrl}${img.url}" style="color:#2563eb;">صورة اللوحة ${i + 1}</a>`,
          ),
        ].join(' &nbsp;|&nbsp; ');

  const symptomsText =
    record.symptoms.length > 0 ? record.symptoms.join('، ') : '—';

  const rows = [
    row('رقم الطلب',     `<span style="font-family:monospace;font-weight:700;">${record.requestId}</span>`),
    row('المصدر',        SOURCE_LABELS[record.source] ?? record.source),
    row('اسم العميل',    record.customerName),
    row('الهاتف',        `<span dir="ltr">${record.phone}</span>`),
    row('المدينة',       record.city ?? '—'),
    row('نوع الجهاز',    record.deviceType ? (DEVICE_LABELS[record.deviceType] ?? record.deviceType) : '—'),
    row('البراند',       record.deviceBrand ?? '—'),
    row('الموديل',       record.deviceModel ?? '—'),
    row('اسم القطعة',    record.partNameAR ?? record.partNameEN ?? '—'),
    row('رقم القطعة',    record.partNumber ?? '—'),
    row('وصف العطل',     record.faultDescription ?? '—'),
    row('الأعطال',       symptomsText),
    row('ملاحظات',       record.notes ?? '—'),
    row('الصور',         `${totalImages > 0 ? `${totalImages} صورة` : 'لا توجد صور'}`),
    ...(totalImages > 0 ? [row('روابط الصور', imageLinksHtml)] : []),
  ].join('');

  const createdAt = new Date(record.createdAt).toLocaleString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;">

  <!-- Header -->
  <tr>
    <td style="background:#1e293b;padding:24px 28px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;color:#f8fafc;font-size:20px;font-weight:700;">📋 طلب عرض سعر جديد</h1>
      <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">مركز قطع غيار المغاسل الصناعية</p>
    </td>
  </tr>

  <!-- Table -->
  <tr>
    <td style="background:#fff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${rows}
      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="background:#fff;padding:24px 28px;text-align:center;border-top:1px solid #e2e8f0;">
      <a href="${siteUrl}/admin/requests"
         style="display:inline-block;background:#1e293b;color:#fff;text-decoration:none;
                padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
        فتح لوحة الإدارة
      </a>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#fff;border-radius:0 0 12px 12px;padding:16px 28px;
               border-top:1px solid #f1f5f9;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">
        ${record.requestId} &nbsp;·&nbsp; ${createdAt}
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendNewRequestEmail(record: QuoteRecord): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const fromAddress = process.env.SMTP_FROM;

  if (!adminEmail) {
    console.warn('[mailer] ADMIN_EMAIL not set — skipping notification');
    return;
  }

  if (!fromAddress) {
    console.warn('[mailer] SMTP_FROM not set — skipping notification');
    return;
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const sourceLabel = SOURCE_LABELS[record.source] ?? record.source;
  const subject = `[طلب جديد] ${record.requestId} — ${sourceLabel} — ${record.customerName}`;

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"مركز قطع غيار المغاسل" <${fromAddress}>`,
    to: adminEmail,
    subject,
    html: buildHtml(record, siteUrl),
  });

  console.info(`[mailer] Notification sent → ${adminEmail} (${record.requestId})`);
}
