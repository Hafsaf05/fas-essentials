import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
export function openDatabase(filename = process.env.DATABASE_PATH || './data/store.sqlite') {
  if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL;');
  db.exec('CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY)');
  const dir = new URL('./migrations/', import.meta.url);
  for (const name of readdirSync(dir).filter(n => n.endsWith('.sql')).sort()) {
    if (!db.prepare('SELECT 1 FROM migrations WHERE name=?').get(name)) {
      db.exec('BEGIN IMMEDIATE');
      try { db.exec(readFileSync(new URL(name, dir), 'utf8')); db.prepare('INSERT INTO migrations VALUES (?)').run(name); db.exec('COMMIT'); }
      catch (e) { db.exec('ROLLBACK'); throw e; }
    }
  }
  return db;
}
export type DB = ReturnType<typeof openDatabase>;
export function transaction<T>(db: DB, action: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try { const result = action(); db.exec('COMMIT'); return result; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}
export const one = (db: DB, sql: string, ...args: any[]): any => db.prepare(sql).get(...args);
export const all = (db: DB, sql: string, ...args: any[]): any[] => db.prepare(sql).all(...args);
export const run = (db: DB, sql: string, ...args: any[]) => db.prepare(sql).run(...args);
