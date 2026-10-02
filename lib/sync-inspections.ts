import { database } from './inspection-store';
import { readInspectionSheet } from './google-inspection-sheet';

type Existing = { id: string; date: string; issue: string; sheet_row: number | null; sheet_hash: string | null; resolved: boolean };

export async function syncInspections() {
  // Read and validate the complete source before touching the database.
  const sheetRows = await readInspectionSheet();
  const db = database();
  const existing = await db.sql<Existing>`SELECT id, date, issue, sheet_row, sheet_hash, resolved FROM inspections`;
  const byRow = new Map(existing.filter(row => row.sheet_row != null).map(row => [row.sheet_row, row]));
  const unlinked = existing.filter(row => row.sheet_row == null);
  let created = 0, updated = 0, linked = 0;
  for (const row of sheetRows) {
    let current = byRow.get(row.sheetRow);
    if (!current) {
      // Historical database rows predate the sync. Link only unambiguous exact matches.
      const matches = unlinked.filter(item => item.date === row.date && item.issue === row.issue);
      if (matches.length > 1) throw new Error(`Ambiguous existing task for sheet row ${row.sheetRow}`);
      current = matches[0];
      if (current) unlinked.splice(unlinked.indexOf(current), 1);
    }
    if (!current) {
      const id = `sheet-${row.sheetRow}`;
      await db.sql`INSERT INTO inspections (id, date, issue, cause, solution, assignee, resolved, notes, photo, completed_date, version, sheet_row, sheet_hash)
        VALUES (${id}, ${row.date}, ${row.issue}, ${row.cause}, ${row.solution}, ${row.assignee}, ${row.resolved}, ${row.notes}, ${row.photo}, ${null}, ${crypto.randomUUID()}, ${row.sheetRow}, ${row.hash})
        ON CONFLICT (id) DO NOTHING`;
      created++;
    } else if (current.sheet_row == null) {
      // Keep changes made in the live app before the first sync.
      await db.sql`UPDATE inspections SET sheet_row=${row.sheetRow}, sheet_hash=${row.hash} WHERE id=${current.id}`;
      linked++;
    } else if (current.sheet_hash !== row.hash) {
      const completedDate = row.resolved && !current.resolved ? new Date().toLocaleDateString('en-CA', { timeZone: 'Atlantic/Canary' }) : null;
      await db.sql`UPDATE inspections SET date=${row.date}, issue=${row.issue}, cause=${row.cause}, solution=${row.solution}, assignee=${row.assignee}, resolved=${row.resolved}, notes=${row.notes}, photo=${row.photo}, completed_date=CASE WHEN ${row.resolved} THEN COALESCE(completed_date, ${completedDate}) ELSE NULL END, version=${crypto.randomUUID()}, sheet_row=${row.sheetRow}, sheet_hash=${row.hash} WHERE id=${current.id}`;
      updated++;
    }
    byRow.set(row.sheetRow, current ?? { id: `sheet-${row.sheetRow}`, date: row.date, issue: row.issue, sheet_row: row.sheetRow, sheet_hash: row.hash, resolved: row.resolved });
  }
  return { total: sheetRows.length, created, updated, linked };
}
