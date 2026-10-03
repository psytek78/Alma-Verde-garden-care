#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';

const [, , command, ...arguments_] = process.argv;
const options = new Map();
for (let index = 0; index < arguments_.length; index += 2) {
  if (!arguments_[index]?.startsWith('--') || !arguments_[index + 1]) throw new Error('Use --file, --id, and optionally --api-url.');
  options.set(arguments_[index].slice(2), arguments_[index + 1]);
}

const base = new URL(options.get('api-url') ?? process.env.GARDEN_CARE_API_URL ?? 'https://almaiso-garden-care.netlify.app');
if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error('Invalid API URL.');
const endpoint = path => new URL(path, base).toString();

async function writeToken() {
  const value = process.env.GARDEN_CARE_WRITE_TOKEN ?? (await readFile(join(homedir(), '.config/almaiso-garden-care/write-token'), 'utf8')).trim();
  if (value.length < 32) throw new Error('Garden Care write token is missing or too short.');
  return value;
}

async function request(path, init = {}) {
  const response = await fetch(endpoint(path), { cache: 'no-store', ...init });
  const result = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
  if (!response.ok) throw new Error(result.error ?? `HTTP ${response.status}`);
  return result;
}

async function jsonFile() {
  const path = options.get('file');
  if (!path) throw new Error('Use --file with a JSON file.');
  return JSON.parse(await readFile(path, 'utf8'));
}

async function authenticated(path, method, body, multipart = false) {
  const token = await writeToken();
  return request(path, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(!multipart ? { 'Content-Type': 'application/json' } : {}) },
    body: multipart ? body : JSON.stringify(body),
  });
}

switch (command) {
  case 'list': {
    console.log(JSON.stringify(await request('/api/inspections'), null, 2));
    break;
  }
  case 'get': {
    const id = options.get('id');
    if (!id) throw new Error('Use --id with a task ID.');
    const { rows } = await request('/api/inspections');
    const row = rows.find(item => item.id === id);
    if (!row) throw new Error('Task not found.');
    console.log(JSON.stringify(row, null, 2));
    break;
  }
  case 'create': {
    const task = await jsonFile();
    if (!task.id) {
      task.id = randomUUID();
      await writeFile(options.get('file'), JSON.stringify(task, null, 2) + '\n', { mode: 0o600 });
    }
    console.log(JSON.stringify(await authenticated('/api/inspections/chat', 'POST', task), null, 2));
    break;
  }
  case 'update': {
    const id = options.get('id');
    if (!id) throw new Error('Use --id with a task ID.');
    const patch = await jsonFile();
    const keys = new Set(['date', 'issue', 'cause', 'solution', 'assignee', 'resolved', 'notes', 'photo']);
    if (!patch || Array.isArray(patch) || Object.keys(patch).some(key => !keys.has(key))) throw new Error('JSON contains an unsupported task field.');
    const { rows } = await request('/api/inspections');
    const row = rows.find(item => item.id === id);
    if (!row) throw new Error('Task not found.');
    const task = Object.fromEntries([...keys].map(key => [key, patch[key] ?? row[key]]));
    console.log(JSON.stringify(await authenticated('/api/inspections/chat', 'PATCH', { ...task, id, version: row.version }), null, 2));
    break;
  }
  case 'upload-photo': {
    const path = options.get('file');
    if (!path) throw new Error('Use --file with a photo.');
    const type = ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' })[extname(path).toLowerCase()];
    if (!type) throw new Error('Use a JPEG, PNG or WebP photo.');
    const form = new FormData();
    form.set('file', new Blob([await readFile(path)], { type }), 'inspection-photo' + extname(path));
    console.log(JSON.stringify(await authenticated('/api/inspection-photos', 'POST', form, true), null, 2));
    break;
  }
  default:
    throw new Error('Use list, get, create, update, or upload-photo.');
}
