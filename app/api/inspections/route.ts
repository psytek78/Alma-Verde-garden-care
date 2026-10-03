import { z } from 'zod';
import { database, readInspections, type GardenTask } from '@/lib/inspection-store';
import { inspectionFields, completionDate } from '@/lib/inspection-input';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
const updateSchema = z.object({
  id: z.string().min(1).max(100),
  assignee: z.string().max(500),
  resolved: z.boolean(),
  version: z.string().min(1).max(128),
}).strict();

export async function GET() {
  try { return Response.json({ rows: await readInspections() }, { headers }); }
  catch { return Response.json({ error: 'Unable to load saved garden care tasks. Please try again.' }, { status: 503, headers }); }
}

export async function POST(req: Request) {
  if (req.headers.get('origin') !== new URL(req.url).origin) return Response.json({ error: 'Invalid request.' }, { status: 403, headers });
  try {
    const body: unknown = await req.json();
    const db = database();
    if (body && typeof body === 'object' && !Array.isArray(body) && 'id' in body && typeof body.id === 'string') {
      const task = updateSchema.parse(body);
      const [existing] = await db.sql<GardenTask>`SELECT * FROM inspections WHERE id=${task.id}`;
      if (!existing) return Response.json({ error: 'Task not found.' }, { status: 404, headers });
      if (String(existing.version) !== task.version) return Response.json({ error: 'This task changed. Close and reopen it before saving.' }, { status: 409, headers });
      const completed = completionDate(task.resolved, existing.resolved, existing.completed_date);
      const version = crypto.randomUUID();
      const updated = await db.sql<GardenTask>`UPDATE inspections SET assignee=${task.assignee}, resolved=${task.resolved}, completed_date=${completed}, version=${version} WHERE id=${task.id} AND version=${task.version} RETURNING *`;
      if (!updated.length) return Response.json({ error: 'This task changed. Close and reopen it before saving.' }, { status: 409, headers });
      return Response.json({ row: updated[0] }, { headers });
    }
    const task = inspectionFields.parse(body);
    const id = crypto.randomUUID();
    const version = crypto.randomUUID();
    const completed = completionDate(task.resolved, false);
    const created = await db.sql<GardenTask>`INSERT INTO inspections (id, date, issue, cause, solution, assignee, resolved, notes, photo, completed_date, version) VALUES (${id}, ${task.date}, ${task.issue}, ${task.cause}, ${task.solution}, ${task.assignee}, ${task.resolved}, ${task.notes}, ${task.photo}, ${completed}, ${version}) RETURNING *`;
    return Response.json({ row: created[0] }, { status: 201, headers });
  } catch (error) {
    return Response.json({ error: error instanceof z.ZodError ? 'Check the task fields and try again.' : 'Unable to confirm the save. Reload before trying again.' }, { status: error instanceof z.ZodError ? 400 : 503, headers });
  }
}
