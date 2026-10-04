import { getCloudflareContext } from '@opennextjs/cloudflare';

export type GardenTask = {
  id: string;
  date: string;
  issue: string;
  cause: string;
  solution: string;
  assignee: string;
  resolved: boolean;
  notes: string;
  photo: string;
  completed_date: string | null;
  confirmed_at: string | null;
  version: string;
  sheet_row?: number | null;
  sheet_hash?: string | null;
};

type InspectionWrite = {
  id: string;
  date: string;
  issue: string;
  cause: string;
  solution: string;
  assignee: string;
  resolved: boolean;
  notes: string;
  photo: string;
};

async function db() {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) throw new Error('Cloudflare D1 binding DB is missing.');
  return env.DB;
}

function bit(value: boolean) {
  return value ? 1 : 0;
}

function text(value: string | null | undefined) {
  return value ?? null;
}

function mapRow(row: Record<string, unknown>): GardenTask {
  return {
    id: String(row.id),
    date: String(row.date),
    issue: String(row.issue),
    cause: String(row.cause ?? ''),
    solution: String(row.solution ?? ''),
    assignee: String(row.assignee ?? ''),
    resolved: row.resolved === 1 || row.resolved === true,
    notes: String(row.notes ?? ''),
    photo: String(row.photo ?? ''),
    completed_date: row.completed_date == null ? null : String(row.completed_date),
    confirmed_at: row.confirmed_at == null ? null : String(row.confirmed_at),
    version: String(row.version),
    sheet_row: row.sheet_row == null ? null : Number(row.sheet_row),
    sheet_hash: row.sheet_hash == null ? null : String(row.sheet_hash),
  };
}

export async function readInspections(): Promise<GardenTask[]> {
  const { results } = await (await db()).prepare('SELECT * FROM inspections ORDER BY date DESC, id ASC').all<Record<string, unknown>>();
  return results.map(mapRow);
}

export async function findInspection(id: string) {
  const row = await (await db()).prepare('SELECT * FROM inspections WHERE id = ?').bind(id).first<Record<string, unknown>>();
  return row ? mapRow(row) : null;
}

export async function insertInspection(task: InspectionWrite, completed: string | null, version: string) {
  const database = await db();
  const result = await database.prepare(`INSERT INTO inspections
    (id, date, issue, cause, solution, assignee, resolved, notes, photo, completed_date, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING`).bind(task.id, task.date, task.issue, task.cause, task.solution, task.assignee, bit(task.resolved), task.notes, task.photo, text(completed), version).run();
  const row = await findInspection(task.id);
  return { row, created: result.meta.changes === 1 };
}

export async function updateInspectionStatus(id: string, expectedVersion: string, assignee: string, resolved: boolean, completed: string | null, version: string) {
  const result = await (await db()).prepare(`UPDATE inspections
    SET assignee = ?, resolved = ?, completed_date = ?, version = ?
    WHERE id = ? AND version = ?`).bind(assignee, bit(resolved), text(completed), version, id, expectedVersion).run();
  if (result.meta.changes !== 1) return null;
  return findInspection(id);
}

export async function updateInspection(task: InspectionWrite, expectedVersion: string, completed: string | null, version: string) {
  const result = await (await db()).prepare(`UPDATE inspections
    SET date = ?, issue = ?, cause = ?, solution = ?, assignee = ?, resolved = ?, notes = ?, photo = ?, completed_date = ?, version = ?
    WHERE id = ? AND version = ?`).bind(task.date, task.issue, task.cause, task.solution, task.assignee, bit(task.resolved), task.notes, task.photo, text(completed), version, task.id, expectedVersion).run();
  if (result.meta.changes !== 1) return null;
  return findInspection(task.id);
}
