import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MEDIA_ROOT = '/root/.openclaw/media';

function contentTypeFor(filePath: string) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filePath: string[] }> }
) {
  const { filePath } = await params;
  const rel = Array.isArray(filePath) ? filePath.join('/') : '';
  const resolved = path.resolve(MEDIA_ROOT, rel);

  if (!resolved.startsWith(MEDIA_ROOT + path.sep)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  try {
    const buf = await fs.readFile(resolved);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentTypeFor(resolved),
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }
}
