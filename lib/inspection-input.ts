import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Invalid date');

const photoLink = z.string().max(2048).refine(value => {
  if (!value) return true;
  if (/^\/api\/inspection-photo\?key=[0-9a-f-]{36}$/.test(value)) return true;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}, 'Invalid photo link');

export const inspectionFields = z.object({
  date: isoDate,
  issue: z.string().trim().min(1).max(2000),
  cause: z.string().max(4000),
  solution: z.string().max(4000),
  assignee: z.string().max(500),
  resolved: z.boolean(),
  notes: z.string().max(8000),
  photo: photoLink,
}).strict();

export const createInspection = inspectionFields.extend({ id: z.string().uuid() }).strict();
export const updateInspection = inspectionFields.extend({ id: z.string().min(1).max(100), version: z.string().min(1).max(128) }).strict();
export type InspectionFields = z.infer<typeof inspectionFields>;

export function completionDate(resolved: boolean, wasResolved: boolean, existingDate?: string | null) {
  if (!resolved) return null;
  if (wasResolved) return existingDate ?? null;
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Atlantic/Canary' });
}
