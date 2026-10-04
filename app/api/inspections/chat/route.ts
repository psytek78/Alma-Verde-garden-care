import { z } from 'zod';
import { findInspection, insertInspection, updateInspection } from '@/lib/inspection-store';
import { authorizeInspectionWrite } from '@/lib/inspection-write-auth';
import { createInspection, updateInspection as updateInspectionFields, completionDate } from '@/lib/inspection-input';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };

export async function POST(req: Request) {
  const denied = authorizeInspectionWrite(req);
  if (denied) return denied;
  try {
    const task = createInspection.parse(await req.json());
    const version = crypto.randomUUID();
    const completed = completionDate(task.resolved, false);
    const inserted = await insertInspection(task, completed, version);
    if (inserted.created && inserted.row) return Response.json({ row: inserted.row }, { status: 201, headers });
    const existing = inserted.row ?? await findInspection(task.id);
    if (existing && Object.entries(task).every(([key, value]) => existing[key as keyof typeof existing] === value)) {
      return Response.json({ row: existing, repeated: true }, { headers });
    }
    return Response.json({ error: 'Task ID already exists with different contents.' }, { status: 409, headers });
  } catch (error) {
    return Response.json({ error: error instanceof z.ZodError ? 'Invalid task fields.' : 'Unable to save the task.' }, { status: error instanceof z.ZodError ? 400 : 503, headers });
  }
}

export async function PATCH(req: Request) {
  const denied = authorizeInspectionWrite(req);
  if (denied) return denied;
  try {
    const task = updateInspectionFields.parse(await req.json());
    const existing = await findInspection(task.id);
    if (!existing) return Response.json({ error: 'Task not found.' }, { status: 404, headers });
    if (existing.version !== task.version) return Response.json({ error: 'Task changed. Reload before saving.' }, { status: 409, headers });
    const completed = completionDate(task.resolved, existing.resolved, existing.completed_date);
    const updated = await updateInspection(task, task.version, completed, crypto.randomUUID());
    if (!updated) return Response.json({ error: 'Task changed. Reload before saving.' }, { status: 409, headers });
    return Response.json({ row: updated }, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof z.ZodError ? 'Invalid task fields.' : 'Unable to save the task.' }, { status: error instanceof z.ZodError ? 400 : 503, headers });
  }
}
