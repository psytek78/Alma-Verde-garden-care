import { z } from 'zod';
import { findInspection, insertInspection, readInspections, updateInspectionStatus } from '@/lib/inspection-store';
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

function fromApp(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  let originHost = '';
  try { originHost = new URL(origin).host; } catch { return false; }
  const forwarded = (req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '').split(',')[0].trim();
  if (forwarded && originHost === forwarded) return true;
  return originHost === 'almaiso-garden-care.netlify.app' || originHost.endsWith('--almaiso-garden-care.netlify.app');
}

export async function POST(req: Request) {
  if (!fromApp(req)) return Response.json({ error: 'Invalid request.' }, { status: 403, headers });
  try {
    const body: unknown = await req.json();
    if (body && typeof body === 'object' && !Array.isArray(body) && 'id' in body && typeof body.id === 'string') {
      const task = updateSchema.parse(body);
      const existing = await findInspection(task.id);
      if (!existing) return Response.json({ error: 'Task not found.' }, { status: 404, headers });
      if (String(existing.version) !== task.version) return Response.json({ error: 'This task changed. Close and reopen it before saving.' }, { status: 409, headers });
      const completed = completionDate(task.resolved, existing.resolved, existing.completed_date);
      const updated = await updateInspectionStatus(task.id, task.version, task.assignee, task.resolved, completed, crypto.randomUUID());
      if (!updated) return Response.json({ error: 'This task changed. Close and reopen it before saving.' }, { status: 409, headers });
      return Response.json({ row: updated }, { headers });
    }
    const task = inspectionFields.parse(body);
    const completed = completionDate(task.resolved, false);
    const { row, created } = await insertInspection({ ...task, id: crypto.randomUUID() }, completed, crypto.randomUUID());
    if (!created || !row) return Response.json({ error: 'Unable to confirm the save. Reload before trying again.' }, { status: 503, headers });
    return Response.json({ row }, { status: 201, headers });
  } catch (error) {
    return Response.json({ error: error instanceof z.ZodError ? 'Check the task fields and try again.' : 'Unable to confirm the save. Reload before trying again.' }, { status: error instanceof z.ZodError ? 400 : 503, headers });
  }
}
