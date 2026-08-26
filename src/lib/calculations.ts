import { getDb, DB } from "./db";

export interface PeriodFilter {
  year?: number;
  month?: number;
}

export function getBillableCategories(): string[] {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM settings WHERE key = 'billable_categories'")
    .get() as { value: string };
  return JSON.parse(row.value);
}

export function getOverhead(): number {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM settings WHERE key = 'overhead_monthly'")
    .get() as { value: string };
  return parseFloat(row.value) || 0;
}

export function getAvailablePeriods() {
  const db = getDb();
  return db
    .prepare(
      "SELECT DISTINCT year, month FROM timesheet_entries ORDER BY year, month"
    )
    .all() as { year: number; month: number }[];
}

export function getPeriodsForFilter(
  filter: PeriodFilter
): { year: number; month: number }[] {
  const db = getDb();
  if (filter.year && filter.month) {
    return [{ year: filter.year, month: filter.month }];
  }
  if (filter.year) {
    return db
      .prepare(
        "SELECT DISTINCT year, month FROM timesheet_entries WHERE year=? ORDER BY month"
      )
      .all(filter.year) as { year: number; month: number }[];
  }
  return db
    .prepare(
      "SELECT DISTINCT year, month FROM timesheet_entries ORDER BY year, month"
    )
    .all() as { year: number; month: number }[];
}

// Direct cost rate per person per month = salary / total hours that month
export function getDirectRates(
  year: number,
  month: number
): Map<string, number> {
  const db = getDb();

  const hours = db
    .prepare(
      `SELECT employee_name, SUM(hours) as total_hours
       FROM timesheet_entries WHERE year=? AND month=?
       GROUP BY employee_name`
    )
    .all(year, month) as { employee_name: string; total_hours: number }[];

  const salaries = db
    .prepare(
      `SELECT employee_name, salary FROM salary_entries WHERE year=? AND month=?`
    )
    .all(year, month) as { employee_name: string; salary: number }[];

  const salaryMap = new Map(salaries.map((s) => [s.employee_name, s.salary]));
  const rates = new Map<string, number>();

  for (const h of hours) {
    const salary = salaryMap.get(h.employee_name) ?? 0;
    rates.set(
      h.employee_name,
      h.total_hours > 0 ? salary / h.total_hours : 0
    );
  }
  return rates;
}

// Indirect cost pool / billable hours = indirect rate per hour
export function getIndirectRate(year: number, month: number): number {
  const db = getDb();
  const billableCategories = getBillableCategories();
  const overhead = getOverhead();
  const placeholders = billableCategories.map(() => "?").join(",");

  const salaries = db
    .prepare(
      `SELECT employee_name, salary FROM salary_entries WHERE year=? AND month=?`
    )
    .all(year, month) as { employee_name: string; salary: number }[];

  const withHours = new Set(
    (
      db
        .prepare(
          `SELECT DISTINCT employee_name FROM timesheet_entries WHERE year=? AND month=?`
        )
        .all(year, month) as { employee_name: string }[]
    ).map((r) => r.employee_name)
  );

  const directRates = getDirectRates(year, month);

  const billableHoursRow = db
    .prepare(
      `SELECT COALESCE(SUM(hours),0) as bh FROM timesheet_entries
       WHERE year=? AND month=? AND category IN (${placeholders})`
    )
    .get(year, month, ...billableCategories) as { bh: number };

  const billableHours = billableHoursRow.bh;
  if (billableHours === 0) return 0;

  let pool = overhead;

  for (const { employee_name, salary } of salaries) {
    if (!withHours.has(employee_name)) {
      // Support staff — full salary into pool
      pool += salary;
    } else {
      // Non-billable hours valued at direct rate
      const nonBillableRow = db
        .prepare(
          `SELECT COALESCE(SUM(hours),0) as h FROM timesheet_entries
           WHERE year=? AND month=? AND employee_name=?
           AND category NOT IN (${placeholders})`
        )
        .get(year, month, employee_name, ...billableCategories) as { h: number };
      const rate = directRates.get(employee_name) ?? 0;
      pool += nonBillableRow.h * rate;
    }
  }

  return pool / billableHours;
}

export interface DashboardMetrics {
  totalHours: number;
  billableHours: number;
  totalCost: number;
  totalRevenue: number;
  margin: number;
  productivity: number;
  warnings: string[];
}

export function getDashboardMetrics(filter: PeriodFilter): DashboardMetrics {
  const db = getDb();
  const billableCategories = getBillableCategories();
  const placeholders = billableCategories.map(() => "?").join(",");
  const periods = getPeriodsForFilter(filter);

  if (periods.length === 0) {
    return {
      totalHours: 0,
      billableHours: 0,
      totalCost: 0,
      totalRevenue: 0,
      margin: 0,
      productivity: 0,
      warnings: [],
    };
  }

  let totalHours = 0;
  let billableHours = 0;
  let totalCost = 0;
  const missingSalary = new Set<string>();

  // Cache rates per period
  const indirectRateCache = new Map<string, number>();
  const directRateCache = new Map<string, Map<string, number>>();

  for (const { year, month } of periods) {
    const key = `${year}-${month}`;
    indirectRateCache.set(key, getIndirectRate(year, month));
    directRateCache.set(key, getDirectRates(year, month));
  }

  const yearMonthConditions = periods.map(() => "(year=? AND month=?)").join(" OR ");
  const yearMonthParams = periods.flatMap((p) => [p.year, p.month]);

  const entries = db
    .prepare(
      `SELECT employee_name, category, year, month, SUM(hours) as hours
       FROM timesheet_entries
       WHERE (${yearMonthConditions})
       GROUP BY employee_name, category, year, month`
    )
    .all(...yearMonthParams) as {
    employee_name: string;
    category: string;
    year: number;
    month: number;
    hours: number;
  }[];

  for (const e of entries) {
    totalHours += e.hours;
    if (billableCategories.includes(e.category)) billableHours += e.hours;

    const key = `${e.year}-${e.month}`;
    const directRate = directRateCache.get(key)?.get(e.employee_name);
    if (directRate === undefined || directRate === 0) {
      missingSalary.add(e.employee_name);
    }
    const indirectRate = indirectRateCache.get(key) ?? 0;
    totalCost += e.hours * ((directRate ?? 0) + indirectRate);
  }

  // Revenue = sum of prices for projects that have hours in this period
  const projectRefCodes = db
    .prepare(
      `SELECT DISTINCT ref_code FROM timesheet_entries
       WHERE (${yearMonthConditions}) AND ref_code IS NOT NULL AND ref_code != ''
       AND category IN (${placeholders})`
    )
    .all(...yearMonthParams, ...billableCategories) as { ref_code: string }[];

  let totalRevenue = 0;
  const missingPrice: string[] = [];
  for (const { ref_code } of projectRefCodes) {
    const project = db
      .prepare("SELECT price, project_name FROM projects WHERE ref_code=?")
      .get(ref_code) as { price: number; project_name: string } | undefined;
    if (project) {
      totalRevenue += project.price;
    } else {
      missingPrice.push(ref_code);
    }
  }

  const warnings: string[] = [];
  if (missingSalary.size > 0)
    warnings.push(`No salary data for: ${[...missingSalary].slice(0, 5).join(", ")}${missingSalary.size > 5 ? ` +${missingSalary.size - 5} more` : ""}`);
  if (missingPrice.length > 0)
    warnings.push(`No price for ref codes: ${missingPrice.slice(0, 5).join(", ")}${missingPrice.length > 5 ? ` +${missingPrice.length - 5} more` : ""}`);

  return {
    totalHours,
    billableHours,
    totalCost,
    totalRevenue,
    margin: totalRevenue > 0 ? (totalRevenue - totalCost) / totalRevenue : 0,
    productivity: totalHours > 0 ? billableHours / totalHours : 0,
    warnings,
  };
}

export function getProjectDetail(refCode: string) {
  const db = getDb();

  const project = db
    .prepare("SELECT * FROM projects WHERE ref_code=?")
    .get(refCode) as {
    ref_code: string;
    project_name: string;
    price: number;
    sales_month: string;
    category: string;
    status: string;
  } | undefined;

  if (!project) return null;

  const entries = db
    .prepare(
      `SELECT t.employee_name, t.department, t.designation, t.year, t.month, SUM(t.hours) as hours
       FROM timesheet_entries t
       WHERE t.ref_code=?
       GROUP BY t.employee_name, t.department, t.designation, t.year, t.month`
    )
    .all(refCode) as {
    employee_name: string;
    department: string;
    designation: string;
    year: number;
    month: number;
    hours: number;
  }[];

  const periods = [...new Set(entries.map((e) => `${e.year}-${e.month}`))].map(
    (k) => {
      const [y, m] = k.split("-");
      return { year: parseInt(y), month: parseInt(m) };
    }
  );

  const indirectRates = new Map<string, number>();
  const directRatesCache = new Map<string, Map<string, number>>();
  for (const { year, month } of periods) {
    const key = `${year}-${month}`;
    indirectRates.set(key, getIndirectRate(year, month));
    directRatesCache.set(key, getDirectRates(year, month));
  }

  const totalProjectHours = entries.reduce((s, e) => s + e.hours, 0);

  const employeeMap = new Map<
    string,
    { hours: number; cost: number; department: string; designation: string }
  >();

  for (const e of entries) {
    const key = `${e.year}-${e.month}`;
    const directRate = directRatesCache.get(key)?.get(e.employee_name) ?? 0;
    const indirectRate = indirectRates.get(key) ?? 0;
    const cost = e.hours * (directRate + indirectRate);

    const existing = employeeMap.get(e.employee_name);
    if (existing) {
      existing.hours += e.hours;
      existing.cost += cost;
    } else {
      employeeMap.set(e.employee_name, {
        hours: e.hours,
        cost,
        department: e.department || "Unknown",
        designation: e.designation || "",
      });
    }
  }

  const employees = Array.from(employeeMap.entries()).map(([name, data]) => {
    const revenueShare =
      totalProjectHours > 0
        ? project.price * (data.hours / totalProjectHours)
        : 0;
    return {
      name,
      ...data,
      revenueShare,
      profitability:
        revenueShare > 0 ? (revenueShare - data.cost) / revenueShare : 0,
    };
  });

  const deptMap = new Map<string, { hours: number; cost: number }>();
  for (const emp of employees) {
    const d = emp.department;
    const existing = deptMap.get(d);
    if (existing) {
      existing.hours += emp.hours;
      existing.cost += emp.cost;
    } else {
      deptMap.set(d, { hours: emp.hours, cost: emp.cost });
    }
  }

  const totalCost = employees.reduce((s, e) => s + e.cost, 0);

  return {
    project,
    totalHours: totalProjectHours,
    totalCost,
    profit: project.price - totalCost,
    margin: project.price > 0 ? (project.price - totalCost) / project.price : 0,
    byDepartment: Array.from(deptMap.entries()).map(([dept, d]) => ({
      dept,
      ...d,
    })),
    employees,
  };
}

export function getProductivity(filter: PeriodFilter) {
  const db = getDb();
  const billableCategories = getBillableCategories();
  const placeholders = billableCategories.map(() => "?").join(",");
  const periods = getPeriodsForFilter(filter);
  if (periods.length === 0) return [];

  const yearMonthConditions = periods.map(() => "(year=? AND month=?)").join(" OR ");
  const yearMonthParams = periods.flatMap((p) => [p.year, p.month]);

  return db
    .prepare(
      `SELECT employee_name,
              MAX(department) as department,
              MAX(designation) as designation,
              SUM(hours) as total_hours,
              SUM(CASE WHEN category IN (${placeholders}) THEN hours ELSE 0 END) as billable_hours
       FROM timesheet_entries
       WHERE (${yearMonthConditions})
       GROUP BY employee_name
       ORDER BY billable_hours DESC`
    )
    .all(...billableCategories, ...yearMonthParams) as {
    employee_name: string;
    department: string;
    designation: string;
    total_hours: number;
    billable_hours: number;
  }[];
}

export function getCategoryBreakdown(filter: PeriodFilter) {
  const db = getDb();
  const periods = getPeriodsForFilter(filter);
  if (periods.length === 0) return [];

  const yearMonthConditions = periods.map(() => "(year=? AND month=?)").join(" OR ");
  const yearMonthParams = periods.flatMap((p) => [p.year, p.month]);

  return db
    .prepare(
      `SELECT category, SUM(hours) as hours, COUNT(DISTINCT employee_name) as people
       FROM timesheet_entries
       WHERE (${yearMonthConditions})
       GROUP BY category
       ORDER BY hours DESC`
    )
    .all(...yearMonthParams) as {
    category: string;
    hours: number;
    people: number;
  }[];
}

export function getAllProjects(filter: PeriodFilter) {
  const db = getDb();
  const billableCategories = getBillableCategories();
  const placeholders = billableCategories.map(() => "?").join(",");
  const periods = getPeriodsForFilter(filter);

  const projects = db
    .prepare("SELECT * FROM projects ORDER BY project_name")
    .all() as {
    ref_code: string;
    project_name: string;
    price: number;
    category: string;
    status: string;
  }[];

  if (periods.length === 0) {
    return projects.map((p) => ({ ...p, totalHours: 0, totalCost: 0, margin: 0 }));
  }

  const yearMonthConditions = periods.map(() => "(year=? AND month=?)").join(" OR ");
  const yearMonthParams = periods.flatMap((p) => [p.year, p.month]);

  const hoursData = db
    .prepare(
      `SELECT ref_code, year, month, employee_name, SUM(hours) as hours
       FROM timesheet_entries
       WHERE (${yearMonthConditions}) AND ref_code IS NOT NULL AND ref_code != ''
       GROUP BY ref_code, year, month, employee_name`
    )
    .all(...yearMonthParams) as {
    ref_code: string;
    year: number;
    month: number;
    employee_name: string;
    hours: number;
  }[];

  const indirectRateCache = new Map<string, number>();
  const directRateCache = new Map<string, Map<string, number>>();
  for (const { year, month } of periods) {
    const key = `${year}-${month}`;
    if (!indirectRateCache.has(key)) {
      indirectRateCache.set(key, getIndirectRate(year, month));
      directRateCache.set(key, getDirectRates(year, month));
    }
  }

  const projectCosts = new Map<string, { hours: number; cost: number }>();
  for (const h of hoursData) {
    const key = `${h.year}-${h.month}`;
    const directRate = directRateCache.get(key)?.get(h.employee_name) ?? 0;
    const indirectRate = indirectRateCache.get(key) ?? 0;
    const cost = h.hours * (directRate + indirectRate);
    const existing = projectCosts.get(h.ref_code);
    if (existing) {
      existing.hours += h.hours;
      existing.cost += cost;
    } else {
      projectCosts.set(h.ref_code, { hours: h.hours, cost });
    }
  }

  return projects.map((p) => {
    const data = projectCosts.get(p.ref_code) ?? { hours: 0, cost: 0 };
    return {
      ...p,
      totalHours: data.hours,
      totalCost: data.cost,
      margin: p.price > 0 ? (p.price - data.cost) / p.price : 0,
    };
  });
}

export function getDepartmentBreakdown(filter: PeriodFilter) {
  const db = getDb();
  const billableCategories = getBillableCategories();
  const placeholders = billableCategories.map(() => "?").join(",");
  const periods = getPeriodsForFilter(filter);
  if (periods.length === 0) return [];

  const yearMonthConditions = periods.map(() => "(year=? AND month=?)").join(" OR ");
  const yearMonthParams = periods.flatMap((p) => [p.year, p.month]);

  return db
    .prepare(
      `SELECT department,
              SUM(hours) as total_hours,
              SUM(CASE WHEN category IN (${placeholders}) THEN hours ELSE 0 END) as billable_hours,
              COUNT(DISTINCT employee_name) as people
       FROM timesheet_entries
       WHERE (${yearMonthConditions})
       GROUP BY department
       ORDER BY total_hours DESC`
    )
    .all(...billableCategories, ...yearMonthParams) as {
    department: string;
    total_hours: number;
    billable_hours: number;
    people: number;
  }[];
}
