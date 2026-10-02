import { createSign, createHash } from 'node:crypto';

export const SHEET_ID = '1OQagNOXmBQkkn7NKh55ub83-b2ne67c3wVMMfGMUFgA';
const RANGE = 'Inspections!A1:H999';
const HEADERS = ['Date', 'Item / Issue', 'Possible cause', 'Solution', 'Assignee', 'Resolved', 'Notes', 'Photo'];

type ServiceAccount = { client_email: string; private_key: string; token_uri?: string };
export type SheetInspection = {
  sheetRow: number; date: string; issue: string; cause: string; solution: string;
  assignee: string; resolved: boolean; notes: string; photo: string; hash: string;
};

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

async function accessToken() {
  const raw = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON is not configured');
  const account = JSON.parse(raw) as ServiceAccount;
  if (!account.client_email || !account.private_key) throw new Error('Incomplete Google service account');
  const now = Math.floor(Date.now() / 1000);
  const audience = 'https://oauth2.googleapis.com/token';
  const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(JSON.stringify({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets.readonly', aud: audience, iat: now, exp: now + 3600 }))}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(account.private_key).toString('base64url')}`;
  const response = await fetch(audience, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
  if (!response.ok) throw new Error(`Google OAuth failed (${response.status})`);
  const token = await response.json() as { access_token?: string };
  if (!token.access_token) throw new Error('Google OAuth returned no token');
  return token.access_token;
}

function dateFromSheet(value: string) {
  const italian = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  const iso = italian ? `${italian[3]}-${italian[2].padStart(2, '0')}-${italian[1].padStart(2, '0')}` : value;
  const date = new Date(`${iso}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) throw new Error(`Invalid date in Inspection: ${value}`);
  return iso;
}

export async function readInspectionSheet(): Promise<SheetInspection[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(RANGE)}?valueRenderOption=FORMATTED_VALUE`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${await accessToken()}` }, cache: 'no-store' });
  if (!response.ok) throw new Error(`Google Sheets read failed (${response.status})`);
  const data = await response.json() as { values?: unknown[][] };
  return parseInspectionRows(data.values);
}

export function parseInspectionRows(rows?: unknown[][]): SheetInspection[] {
  if (!rows || HEADERS.some((header, index) => rows[0]?.[index] !== header)) throw new Error('Inspection headers do not match the expected eight columns');
  return rows.slice(1).flatMap((raw, index) => {
    const cells = HEADERS.map((_, column) => String(raw[column] ?? ''));
    if (!cells[1].trim()) return [];
    const date = dateFromSheet(cells[0].trim());
    const checkbox = cells[5].trim().toUpperCase();
    const resolved = checkbox === 'TRUE';
    if (checkbox && !['TRUE', 'FALSE'].includes(checkbox)) throw new Error(`Invalid checkbox in Inspection row ${index + 2}`);
    const hash = createHash('sha256').update(JSON.stringify([date, ...cells.slice(1, 5), resolved, ...cells.slice(6)])).digest('hex');
    return [{ sheetRow: index + 2, date, issue: cells[1], cause: cells[2], solution: cells[3], assignee: cells[4], resolved, notes: cells[6], photo: cells[7], hash }];
  });
}
