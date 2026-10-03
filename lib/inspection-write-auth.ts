import { createHash, timingSafeEqual } from 'node:crypto';

export function authorizeInspectionWrite(req: Request): Response | null {
  const token = process.env.GARDEN_CARE_WRITE_TOKEN;
  if (!token || token.length < 32) return Response.json({ error: 'Garden Care write access is not configured.' }, { status: 503 });
  const supplied = /^Bearer (.+)$/i.exec(req.headers.get('authorization') ?? '')?.[1] ?? '';
  const digest = (value: string) => createHash('sha256').update(value).digest();
  if (!timingSafeEqual(digest(supplied), digest(token))) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } });
  }
  return null;
}
