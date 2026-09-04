import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'db.json');

let cache = null;

function load() {
  if (cache) return cache;
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  cache = JSON.parse(raw);
  return cache;
}

function save() {
  if (!cache) return;
  fs.writeFileSync(DB_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

export function getDB() {
  return load();
}

export function commit() {
  save();
}

export function resetCache() {
  cache = null;
}

export function nextId(collection) {
  const db = load();
  const items = db[collection] || [];
  if (items.length === 0) return 1;
  const max = Math.max(...items.map((item) => Number(item.id) || 0));
  return max + 1;
}
