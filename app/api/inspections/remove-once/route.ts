import { database } from '@/lib/inspection-store';

export const dynamic = 'force-dynamic';
const issue = 'Resolve the delicate problems of the abandoned inflorescences.';
const ids = ['b39fc79d-d1ee-4230-9f76-d3ffc6c32e0a', 'd9394d96-f610-4315-9430-0635f20f9f24'];

export async function POST(req: Request) {
  if (req.headers.get('x-remove') !== 'garden-care-once') return Response.json({ error: 'Invalid request.' }, { status: 403 });
  const deleted = await database().sql<{ id: string }>`DELETE FROM inspections WHERE issue=${issue} AND (id=${ids[0]} OR id=${ids[1]}) RETURNING id`;
  return Response.json({ deleted });
}
