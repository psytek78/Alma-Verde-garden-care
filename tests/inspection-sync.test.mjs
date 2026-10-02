import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInspectionRows } from '../lib/google-inspection-sheet.ts';

const headers = ['Date', 'Item / Issue', 'Possible cause', 'Solution', 'Assignee', 'Resolved', 'Notes', 'Photo'];

test('maps sheet rows, dates, checkboxes and blank rows to Netlify tasks', () => {
  const rows = parseInspectionRows([headers, ['02/10/2026', 'Plant fennel', '', 'Water it', 'Lilli', 'FALSE', '', ''], ['', '', '', '', '', 'FALSE'], ['01/10/2026', 'Prune papaya', '', '', 'Roberto', 'TRUE', '', '']]);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => [row.sheetRow, row.date, row.issue, row.resolved]), [[2, '2026-10-02', 'Plant fennel', false], [4, '2026-10-01', 'Prune papaya', true]]);
  assert.equal(rows[0].hash, parseInspectionRows([headers, ['02/10/2026', 'Plant fennel', '', 'Water it', 'Lilli', 'FALSE', '', '']])[0].hash);
});

test('rejects changed headers and invalid dates before database writes', () => {
  assert.throws(() => parseInspectionRows([['Wrong']]), /headers/);
  assert.throws(() => parseInspectionRows([headers, ['31/02/2026', 'Invalid date']]), /Invalid date/);
});

test('preserves historic task text for matching without duplicates', () => {
  const [row] = parseInspectionRows([headers, ['30/09/2026', 'potting Phisalis ', '', '', 'Sanne ', 'TRUE']]);
  assert.equal(row.issue, 'potting Phisalis ');
  assert.equal(row.assignee, 'Sanne ');
});
