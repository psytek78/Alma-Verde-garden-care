import { getStore } from '@netlify/blobs';
import { authorizeInspectionWrite } from '../../lib/inspection-write-auth';

export const config = { path: '/api/inspection-photos' };
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const types = new Set(['image/jpeg', 'image/png', 'image/webp']);

function fromApp(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  let originHost = '';
  try { originHost = new URL(origin).host; } catch { return false; }
  const host = (req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '').split(',')[0].trim();
  if (host && originHost === host) return true;
  try { return origin === new URL(req.url).origin; } catch { return false; }
}

function matchesType(bytes: Uint8Array, type: string) {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  if (type === 'image/webp') return new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
  return false;
}

export default async function uploadInspectionPhoto(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
  if (!fromApp(req)) {
    const denied = authorizeInspectionWrite(req);
    if (denied) return denied;
  }
  if (!req.headers.get('content-type')?.startsWith('multipart/form-data')) return Response.json({ error: 'Upload a photo as multipart form data.' }, { status: 415 });
  const length = Number(req.headers.get('content-length') ?? 0);
  if (length > MAX_PHOTO_BYTES + 100_000) return Response.json({ error: 'Photo must be smaller than 3 MB.' }, { status: 413 });
  try {
    const file = (await req.formData()).get('file');
    if (!(file instanceof File) || !types.has(file.type) || file.size < 12 || file.size > MAX_PHOTO_BYTES) {
      return Response.json({ error: 'Upload a JPEG, PNG or WebP photo smaller than 3 MB.' }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesType(bytes, file.type)) return Response.json({ error: 'Photo content does not match its type.' }, { status: 400 });
    const key = crypto.randomUUID();
    const saved = await getStore({ name: 'inspection-photos', consistency: 'strong' }).set(key, bytes.buffer, { onlyIfNew: true, metadata: { contentType: file.type } });
    if (!saved.modified) throw new Error('Photo was not stored');
    return Response.json({ photo: `/api/inspection-photo?key=${key}` }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return Response.json({ error: 'Unable to save the photo.' }, { status: 503 });
  }
}
