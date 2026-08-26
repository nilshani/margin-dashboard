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
  seedDemoDataIfEmpty(db as DB);
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

export function seedDemoData(db: DB) {
  runTransaction(db, () => seedDemoRows(db));
}

function seedDemoRows(db: DB) {
  const insertTimesheet = db.prepare(`
    INSERT INTO timesheet_entries
      (year, month, employee_no, employee_name, expense_type, department,
       designation, category, ref_code, project_name, company, description, hours)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const insertSalary = db.prepare(
    "INSERT INTO salary_entries (employee_name, year, month, salary) VALUES (?,?,?,?)"
  );
  const insertProject = db.prepare(
    "INSERT INTO projects (ref_code, project_name, price, sales_month, category, status) VALUES (?,?,?,?,?,?)"
  );

  insertProject.run("DEMO-001", "Website Relaunch", 120000, "Mar 2025", "Digital", "Active");
  insertProject.run("DEMO-002", "Brand System", 80000, "Mar 2025", "Brand", "Active");

  const people = [
      ["D001", "Aisha Khan", "Design", "Senior Designer", 18000],
      ["E002", "Omar Hassan", "Engineering", "Tech Lead", 22000],
      ["P003", "Maya Singh", "Project Management", "Account Manager", 16000],
  ];
  for (const [employeeNo, name, department, designation, salary] of people) {
    for (const month of [1, 2, 3]) {
      insertSalary.run(name, 2025, month, salary);
    }
  }

  const work = [
      ["D001", "Aisha Khan", "Design", "Senior Designer", "Projects", "DEMO-001", "Website design", 72],
      ["D001", "Aisha Khan", "Design", "Senior Designer", "FC - Meetings", "", "Internal meeting", 8],
      ["E002", "Omar Hassan", "Engineering", "Tech Lead", "Projects", "DEMO-001", "Frontend implementation", 96],
      ["E002", "Omar Hassan", "Engineering", "Tech Lead", "Enhancements", "DEMO-002", "Brand tooling", 48],
      ["E002", "Omar Hassan", "Engineering", "Tech Lead", "FC - Learning", "", "Training", 8],
      ["P003", "Maya Singh", "Project Management", "Account Manager", "Projects", "DEMO-001", "Planning and delivery", 64],
      ["P003", "Maya Singh", "Project Management", "Account Manager", "Projects", "DEMO-002", "Brand project management", 40],
      ["P003", "Maya Singh", "Project Management", "Account Manager", "FC - Meetings", "", "Client meetings", 16],
  ];
  for (const [employeeNo, name, department, designation, category, refCode, description, hours] of work) {
    for (const month of [1, 2, 3]) {
      insertTimesheet.run(
        2025, month, employeeNo, name, "", department, designation, category,
        refCode, refCode === "DEMO-001" ? "Website Relaunch" : refCode === "DEMO-002" ? "Brand System" : "",
        "Demo Co", description, Number(hours)
      );
    }
  }
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('data_source', 'demo')").run();
}

function seedDemoDataIfEmpty(db: DB) {
  const row = db.prepare(
    "SELECT (SELECT COUNT(*) FROM timesheet_entries) + (SELECT COUNT(*) FROM salary_entries) + (SELECT COUNT(*) FROM projects) AS total"
  ).get() as { total: number };
  if (row.total === 0) seedDemoData(db);
}

export function resetToDemoData(db: DB) {
  runTransaction(db, () => {
    db.prepare("DELETE FROM timesheet_entries").run();
    db.prepare("DELETE FROM salary_entries").run();
    db.prepare("DELETE FROM projects").run();
    seedDemoRows(db);
  });
}
