import { getCloudflareContext } from '@opennextjs/cloudflare';

export const dynamic = 'force-dynamic';
const keyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get('key') ?? '';
  if (!keyPattern.test(key)) return new Response('Photo not found', { status: 404 });
  try {
    const { env } = await getCloudflareContext({ async: true });
    const entry = await env.PHOTOS.get(key);
    if (!entry) return new Response('Photo not found', { status: 404 });
    const contentType = entry.httpMetadata?.contentType ?? '';
    if (!allowedTypes.has(contentType)) return new Response('Photo unavailable', { status: 503 });
    return new Response(entry.body, { headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
    } });
  } catch {
    return new Response('Photo unavailable', { status: 503 });
  }
}
