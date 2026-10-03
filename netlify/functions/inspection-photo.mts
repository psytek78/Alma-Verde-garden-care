import { getStore } from '@netlify/blobs';

export const config = { path: '/api/inspection-photo' };
const keyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default async function inspectionPhoto(req: Request) {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
  const key = new URL(req.url).searchParams.get('key') ?? '';
  if (!keyPattern.test(key)) return new Response('Photo not found', { status: 404 });
  try {
    const entry = await getStore({ name: 'inspection-photos', consistency: 'strong' }).getWithMetadata(key, { type: 'arrayBuffer' });
    if (!entry || !entry.data) return new Response('Photo not found', { status: 404 });
    const contentType = String(entry.metadata?.contentType ?? '');
    if (!allowedTypes.has(contentType)) return new Response('Photo unavailable', { status: 503 });
    return new Response(entry.data, { headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
    } });
  } catch {
    return new Response('Photo unavailable', { status: 503 });
  }
}
