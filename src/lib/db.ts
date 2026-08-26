// Uses Node.js built-in sqlite (Node 22+). No native compilation required.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require("node:sqlite");
import path from "path";

export type DB = {
  exec: (sql: string) => void;
  prepare: (sql: string) => Statement;
};

type Statement = {
  run: (...args: unknown[]) => { changes: number };
  get: (...args: unknown[]) => unknown;
  all: (...args: unknown[]) => unknown[];
};

let _db: DB | null = null;

export function getDb(): DB {
  if (_db) return _db;
  const db = new DatabaseSync(path.join(process.cwd(), "data.db"));
  initSchema(db);
  _db = db as DB;
  return _db;
}

// node:sqlite doesn't have a transaction helper — we wrap in BEGIN/COMMIT manually
export function runTransaction(db: DB, fn: () => void) {
  db.prepare("BEGIN").run();
  try {
    fn();
    db.prepare("COMMIT").run();
  } catch (e) {
    db.prepare("ROLLBACK").run();
    throw e;
  }
}

function initSchema(db: DB) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS timesheet_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      employee_no TEXT,
      employee_name TEXT NOT NULL,
      expense_type TEXT,
      department TEXT,
      designation TEXT,
      category TEXT,
      ref_code TEXT,
      project_name TEXT,
      company TEXT,
      description TEXT,
      hours REAL NOT NULL DEFAULT 0,
      UNIQUE(year, month, employee_name, ref_code, project_name, description)
    );

    CREATE TABLE IF NOT EXISTS salary_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      salary REAL NOT NULL DEFAULT 0,
      UNIQUE(employee_name, year, month)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref_code TEXT NOT NULL UNIQUE,
      project_name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      sales_month TEXT,
      category TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings VALUES ('overhead_monthly', '0');
    INSERT OR IGNORE INTO settings VALUES ('billable_categories', '["Projects","Enhancements","Hosting"]');
  `);
}
