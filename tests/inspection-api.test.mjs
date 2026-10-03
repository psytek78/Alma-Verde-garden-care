import test from 'node:test';
import assert from 'node:assert/strict';
import { createInspection, updateInspection, completionDate } from '../lib/inspection-input.ts';
import { authorizeInspectionWrite } from '../lib/inspection-write-auth.ts';

const task = {
  id: '67d0c8f2-35b4-4b75-9688-5cfb10342fb4',
  date: '2026-10-03', issue: 'Inspect the new planting bed', cause: '', solution: '',
  assignee: '', resolved: false, notes: 'Test task', photo: '',
};

test('accepts a complete task and a Netlify photo link', () => {
  assert.equal(createInspection.parse(task).issue, task.issue);
  assert.equal(updateInspection.parse({ ...task, photo: '/api/inspection-photo?key=67d0c8f2-35b4-4b75-9688-5cfb10342fb4', version: 'v1' }).version, 'v1');
});

test('rejects invalid dates, unsafe photo links and missing optimistic version', () => {
  assert.equal(createInspection.safeParse({ ...task, date: '2026-02-31' }).success, false);
  assert.equal(createInspection.safeParse({ ...task, photo: 'javascript:alert(1)' }).success, false);
  assert.equal(updateInspection.safeParse(task).success, false);
});

test('write API is closed without a configured secret and rejects a wrong bearer', () => {
  const previous = process.env.GARDEN_CARE_WRITE_TOKEN;
  delete process.env.GARDEN_CARE_WRITE_TOKEN;
  assert.equal(authorizeInspectionWrite(new Request('https://example.test'))?.status, 503);
  process.env.GARDEN_CARE_WRITE_TOKEN = 'a'.repeat(48);
  assert.equal(authorizeInspectionWrite(new Request('https://example.test', { headers: { Authorization: 'Bearer wrong' } }))?.status, 401);
  assert.equal(authorizeInspectionWrite(new Request('https://example.test', { headers: { Authorization: `Bearer ${'a'.repeat(48)}` } })), null);
  if (previous === undefined) delete process.env.GARDEN_CARE_WRITE_TOKEN;
  else process.env.GARDEN_CARE_WRITE_TOKEN = previous;
});

test('completion date clears on reopening and stays fixed on an existing completion', () => {
  assert.equal(completionDate(false, true, '2026-10-02'), null);
  assert.equal(completionDate(true, true, '2026-10-02'), '2026-10-02');
});
