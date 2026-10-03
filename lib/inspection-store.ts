import { getDatabase } from '@netlify/database';
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
export function database() { return getDatabase(); }
export async function readInspections(): Promise<GardenTask[]> {
  return await database().sql<GardenTask>`SELECT * FROM inspections ORDER BY date DESC, id ASC`;
}
