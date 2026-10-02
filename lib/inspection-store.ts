import { getDatabase } from '@netlify/database';
import type initial from './initial-inspections.json';
export type GardenTask = (typeof initial)[number] & {completed_date?: string | null};
export function database() { return getDatabase(); }
export async function readInspections(): Promise<GardenTask[]> {
  return await database().sql<GardenTask>`SELECT * FROM inspections ORDER BY date DESC, id ASC`;
}
