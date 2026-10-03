import { z } from 'zod';
import { database, type GardenTask } from '@/lib/inspection-store';
import { authorizeInspectionWrite } from '@/lib/inspection-write-auth';
import { createInspection, updateInspection, completionDate } from '@/lib/inspection-input';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };

export async function POST(req: Request) {
  const denied = authorizeInspectionWrite(req);
  if (denied) return denied;
  try {
    const task = createInspection.parse(await req.json());
    const db = database();
    const version = crypto.randomUUID();
    const completed = completionDate(task.resolved, false);
    const inserted = await db.sql<GardenTask>`INSERT INTO inspections
      (id, date, issue, cause, solution, assignee, resolved, notes, photo, completed_date, version)
      VALUES (${task.id}, ${task.date}, ${task.issue}, ${task.cause}, ${task.solution}, ${task.assignee}, ${task.resolved}, ${task.notes}, ${task.photo}, ${completed}, ${version})
      ON CONFLICT (id) DO NOTHING RETURNING *`;
    if (inserted.length) return Response.json({ row: inserted[0] }, { status: 201, headers });
    const [existing] = await db.sql<GardenTask>`SELECT * FROM inspections WHERE id=${task.id}`;
    if (existing && Object.entries(task).every(([key, value]) => existing[key as keyof GardenTask] === value)) {
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
    const task = updateInspection.parse(await req.json());
    const db = database();
    const [existing] = await db.sql<GardenTask>`SELECT * FROM inspections WHERE id=${task.id}`;
    if (!existing) return Response.json({ error: 'Task not found.' }, { status: 404, headers });
    if (existing.version !== task.version) return Response.json({ error: 'Task changed. Reload before saving.' }, { status: 409, headers });
    const completed = completionDate(task.resolved, existing.resolved, existing.completed_date);
    const version = crypto.randomUUID();
    const updated = await db.sql<GardenTask>`UPDATE inspections SET
      date=${task.date}, issue=${task.issue}, cause=${task.cause}, solution=${task.solution},
      assignee=${task.assignee}, resolved=${task.resolved}, notes=${task.notes}, photo=${task.photo},
      completed_date=${completed}, version=${version}
      WHERE id=${task.id} AND version=${task.version} RETURNING *`;
    if (!updated.length) return Response.json({ error: 'Task changed. Reload before saving.' }, { status: 409, headers });
    return Response.json({ row: updated[0] }, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof z.ZodError ? 'Invalid task fields.' : 'Unable to save the task.' }, { status: error instanceof z.ZodError ? 400 : 503, headers });
  }
}
