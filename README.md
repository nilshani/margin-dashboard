# Margin Dashboard

A local-first agency profitability dashboard built with Next.js, React, TypeScript, SQLite, and Tailwind CSS. It imports timesheet, salary, and project-price spreadsheets, calculates cost and profitability, and presents the results through operational dashboard views.

## Contents

- [What It Does](#what-it-does)
- [Five-Minute Quick Start](#five-minute-quick-start)
- [Requirements](#requirements)
- [Installation](#installation)
- [Run the Application](#run-the-application)
- [Build for Production](#build-for-production)
- [First Run and Demo Data](#first-run-and-demo-data)
- [Spreadsheet Upload](#spreadsheet-upload)
- [Salary Year Handling](#salary-year-handling)
- [Re-upload Behavior](#re-upload-behavior)
- [Pages](#pages)
- [Calculations](#calculations)
- [Assumptions](#assumptions)
- [Data Model](#data-model)
- [API Routes](#api-routes)
- [Settings](#settings)
- [Resetting the Database](#resetting-the-database)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [Validation](#validation)
- [Limitations](#limitations)

## What It Does

The dashboard supports:

- Dashboard totals for hours, billable hours, cost, revenue, profit, margin, and productivity.
- Year and month filtering across time-based views.
- Project detail pages with department and employee contribution data.
- Employee productivity: billable hours divided by total hours.
- Category breakdown: where logged time goes.
- Department summaries and employee-level department drill-down.
- Configurable billable categories and monthly overhead.
- CSV export from dashboard tables.
- Employee-by-category matrix.
- Monthly cost-rate audit.
- Multi-year comparison.
- Built-in demo data so a new database is populated immediately.

## Five-Minute Quick Start

From a clean checkout, install dependencies and start the local server. On macOS or Linux, run:

```bash
npm install
npm run dev
```

On Windows PowerShell, run the same npm commands:

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root URL opens the Dashboard, which is populated automatically with a 2025 demo dataset on first database access. Use the navigation to inspect Projects, Productivity, Categories, Departments, Matrix, Year Comparison, and Cost Audit.

To use real spreadsheets instead:

1. Stop the server and back up/remove the local database: `Copy-Item .\data.db .\data.db.backup` then `Remove-Item .\data.db`.
2. Run `npm run dev` again and open `/upload`.
3. Upload the timesheet, salary, and project files. The first valid real upload clears the automatically seeded demo records.
4. If salary headers contain only month names, enter the salary year, such as `2025`. Headers containing `January 2025` already include their year.
5. Set overhead and billable categories in `/settings`, then select the full year on the Dashboard to run the self-check.

No separate database server or environment file is required.

This application is fully local. It requires no cloud account, API key, external service, paid service, or network database. A clean checkout creates `data.db` locally on first use and seeds the demo dataset automatically.

## Requirements

- Node.js 22.5 or newer.
- Node.js 22.5 or newer is required because the application uses the built-in `node:sqlite` module.
- npm.

Check your versions:

```powershell
node --version
npm --version
```

## Installation

From the project directory:

```powershell
npm install
```

No separate database server is required. SQLite creates `data.db` in the project root when the application first accesses the database.

## Run the Application

Development mode:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

The root URL redirects to `/dashboard`.

If port 3000 is already in use:

```powershell
npx next dev -p 3001
```

Then open `http://localhost:3001`.

## Build for Production

Create an optimized production build:

```powershell
npm run build
```

Run the production build:

```powershell
npm run start
```

The production server normally runs at `http://localhost:3000`.

## First Run and Demo Data

When the database contains no timesheet, salary, or project records, the application automatically inserts a small 2025 demo dataset. This means the dashboard is populated on first open instead of showing an empty shell.

The demo dataset contains:

- Three employees across Design, Engineering, and Project Management.
- Salary rows for January through March 2025.
- Billable and non-billable timesheet entries.
- Two projects with prices.
- Default billable categories: `Projects`, `Enhancements`, and `Hosting`.
- Zero monthly overhead.

To reload the demo data:

1. Open `/upload`.
2. Click **Load demo data**.
3. Confirm the dashboard at `/dashboard`.

Loading demo data deletes current timesheet, salary, and project records and replaces them with the demo dataset. It is intended for demonstrations or a deliberate reset, not for preserving real data.

## Spreadsheet Upload

Open `/upload` and upload the three files separately:

1. Timesheet.
2. Salary overview.
3. Project prices.

### Start a fresh spreadsheet upload

If the new spreadsheet set should be the only data in the dashboard, stop the development server and remove the existing database before uploading. Make a backup first if the current data may be needed:

```powershell
Copy-Item .\data.db .\data.db.backup
Remove-Item .\data.db
```

Then start the application again:

```powershell
npm run dev
```

Open `/upload` and upload the timesheet, salary, and project spreadsheets. A new database is created automatically. The first real spreadsheet upload automatically removes the initial demo records, so demo data will not be mixed with the real dataset. Do not click **Load demo data** during a real upload, because that action replaces current records with the demo dataset.

Deleting `data.db` permanently removes all local timesheet, salary, project, and settings data. Keep the backup until the new upload has been checked.

Accepted file types:

- `.xlsx`
- `.xls`

### Timesheet format

The workbook should contain a header row with employee and hours columns. The parser searches the first 16 rows of every sheet.

Recognized fields include:

| Purpose | Recognized examples |
|---|---|
| Month | `Month` |
| Employee number | `Employee No`, `Employee Number`, `Employee No.` |
| Employee name | `Employee Name`, `Emp Name` |
| Expense type | `Type of Expense`, `Expense Type`, `Type` |
| Department | `Department`, `Dept` |
| Designation | `Designation`, `Role`, `Position` |
| Category | `Category` |
| Reference code | `Ref Code`, `Ref` |
| Project | `Project`, `Task Name` |
| Company | `Company` |
| Description | `Description`, `Desc` |
| Hours | `Hours`, `Hrs` |

Each row should represent one employee, task/category, and month. Month values can be written as `January 2025`, `Jan 2025`, `Jan-25`, or a month-only value when the year context is known.

### Salary format

The salary workbook should contain one employee per row and months as columns. The parser searches the first 16 rows for at least three month columns.

Example:

| Employee Name | January 2025 | February 2025 | March 2025 |
|---|---:|---:|---:|
| Aisha Khan | 18000 | 18000 | 18000 |
| Omar Hassan | 22000 | 22000 | 22000 |

Recognized month formats include `January 2025`, `Jan 2025`, `Jan '25`, and month-only headers such as `January`.

### Project format

The workbook should contain a project row with reference code and price columns. The parser searches the first 16 rows of every sheet.

Example:

| Ref Code | Project Name | Project Price | Sales Month | Category | Status |
|---|---|---:|---|---|---|
| PRJ-001 | Website Relaunch | 120000 | Mar 2025 | Digital | Active |

Reference code and price are the required identifying fields. Other project fields are optional.

## Salary Year Handling

This is important when salary headers contain only month names.

If the spreadsheet headers are:

```text
January | February | March
```

enter the correct year in **Salary year for month-only headers** on the Upload page, for example `2025`.

If the headers already include the year:

```text
January 2025 | February 2025 | March 2025
```

leave the input empty. The year in each header is used directly.

Timesheet and salary records must use matching `year + month` periods for cost rates to be calculated. For example, 2025 timesheets need 2025 salary rows.

## Re-upload Behavior

Uploads use database upserts:

- Timesheet uniqueness: year, month, employee, reference code, project name, and description.
- Salary uniqueness: employee, year, and month.
- Project uniqueness: reference code.

Re-uploading a corrected row updates the existing row instead of duplicating it. Existing data from other months remains in the database.

A replacement file does not currently delete old rows that are absent from the new file. Use **Load demo data** only when you intentionally want to clear all records, or remove `data.db` for a complete reset.

## Pages

| URL | Purpose |
|---|---|
| `/dashboard` | Company-wide metrics, warnings, chart, and period filter. |
| `/projects` | Project list with hours, cost, margin, and CSV export. |
| `/projects/[id]` | Project price, hours, cost, profit, margin, departments, and employee profitability. |
| `/productivity` | Employee billable hours, total hours, and productivity. |
| `/categories` | Hours by category with chart and table. |
| `/departments` | Department totals and productivity. Rows open employee drill-down. |
| `/departments/[id]` | Employee hours and billable hours within one department. |
| `/matrix` | Employee-by-category hours pivot. |
| `/comparison` | Side-by-side yearly metrics. |
| `/audit` | Monthly salary, overhead, hours, rates, and allocated cost inputs. |
| `/upload` | Spreadsheet uploads and demo data reset. |
| `/settings` | Billable categories and monthly overhead configuration. |

## Calculations

All rates are calculated per employee and per month unless stated otherwise.

### Direct cost rate

```text
direct cost rate = that month's salary / that month's total logged hours
```

An employee with hours but no matching salary receives a zero direct rate and appears in dashboard warnings.

### Indirect cost pool

```text
indirect cost pool =
  salaries of people who logged no hours
  + everyone else's non-billable time valued at their direct rate
  + monthly overhead
```

### Indirect cost rate

```text
indirect cost rate = indirect cost pool / billable hours that month
```

If there are no billable hours, the indirect rate is zero.

### Company cost

For company-wide dashboard calculations:

```text
company cost = direct cost for all logged hours
             + indirect rate applied to billable hours
```

This avoids allocating the indirect pool twice. With matching salary and timesheet periods and overhead set to zero, the full-year company cost should reconcile to full-year salaries.

### Employee cost on a project

Project entries are limited to configured billable categories:

```text
employee project cost = hours * (direct rate + indirect rate)
```

### Employee revenue share

```text
employee revenue share =
  project price * (employee hours / total project hours)
```

### Employee profitability

```text
employee profitability =
  (revenue share - employee cost) / revenue share
```

### Project profitability

```text
project profitability =
  (project price - total project cost) / project price
```

### Productivity

```text
productivity = billable hours / total hours logged
```

## Assumptions

The brief leaves some business rules open. This implementation makes the following explicit assumptions:

- **Billable categories:** `Projects`, `Enhancements`, and `Hosting` are billable by default. This is configurable in `/settings`; category names must match the timesheet values.
- **Cost period:** salary and timesheet data match by exact employee name, year, and month. A salary from another year is not used as a substitute.
- **Direct rate:** an employee's monthly salary is divided by that employee's total logged hours for that month, including billable and non-billable hours.
- **Support staff:** a person with salary but no logged hours contributes their full salary to the indirect pool.
- **Indirect allocation:** the indirect rate is applied to billable hours. Non-billable hours are valued through the indirect pool calculation and are not charged indirect cost again.
- **Project revenue:** a project's full stored price is counted when it has billable timesheet hours in the selected period. The price is not prorated by month.
- **Employee revenue share:** project price is distributed in proportion to each employee's billable project hours.
- **Missing data:** missing salary or project price is not guessed. Costs use zero for the missing input and the Dashboard displays warnings where applicable.
- **Name matching:** employee names are matched as exact text. Differences in spelling, spacing, or capitalization can prevent salary matching.
- **Spreadsheet structure:** the parser searches the first 16 rows of each worksheet and processes every matching worksheet.
- **Re-uploading:** matching rows are updated without duplication. Rows removed from a corrected spreadsheet are not automatically deleted; remove `data.db` before a clean replacement upload.
- **Storage and access:** data is local to one `data.db` SQLite file. There is no authentication, multi-user isolation, or remote database.
- **Demo data:** an empty database is seeded for immediate evaluation. The first valid real spreadsheet upload clears those demo records; the explicit **Load demo data** action intentionally replaces current records.

## Data Model

The SQLite database is stored in `data.db`.

### `timesheet_entries`

Stores employee time entries with year, month, employee, department, category, project reference, description, and hours.

### `salary_entries`

Stores one salary amount per employee, year, and month.

### `projects`

Stores project reference code, name, price, sales month, category, and status.

### `settings`

Stores configurable values as key/value pairs:

- `overhead_monthly`: numeric monthly overhead.
- `billable_categories`: JSON array of category names.
- `data_source`: set to `demo` when demo data is loaded.

## API Routes

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/upload` | Parse and upsert a timesheet, salary, or projects workbook. |
| `POST` | `/api/demo` | Replace current business records with demo data. |
| `GET` | `/api/dashboard` | Dashboard metrics and available periods. |
| `GET` | `/api/projects` | Project list and period-filtered cost data. |
| `GET` | `/api/projects/[id]` | Project detail. |
| `GET` | `/api/productivity` | Employee productivity rows. |
| `GET` | `/api/categories` | Category hour totals. |
| `GET` | `/api/departments` | Department totals. |
| `GET` | `/api/departments/[id]` | Employee rows for one department. |
| `GET` | `/api/matrix` | Employee-category matrix. |
| `GET` | `/api/comparison` | Yearly comparison metrics. |
| `GET` | `/api/audit` | Monthly audit/rate data. |
<!-- | `GET`, `POST` | `/api/settings` | Read or update assumptions. | -->

## Settings

Open `/settings` to configure:

- **Monthly Overhead (AED):** added to the indirect cost pool for each month.
- **Billable Categories:** comma-separated category names used in billable-hour calculations.

The default categories are:

```text
Projects, Enhancements, Hosting
```

After changing settings, reload the dashboard or another data view to see the updated calculations.

## Resetting the Database

### Reset to demo data

Use the **Load demo data** button on `/upload`. This clears timesheet, salary, and project rows and loads the built-in dataset.

### Delete the database completely

Stop the development server first, then run:

```powershell
Remove-Item .\data.db
```

Start the application again. A new database is created and demo data is seeded automatically.

Do not delete `data.db` if it contains data you need. Make a backup first:

```powershell
Copy-Item .\data.db .\data.db.backup
```

## Troubleshooting

### Dashboard values are zero

Check that salary and timesheet rows use the same year and month. For example, 2025 timesheets paired with 2026 salaries produce zero direct rates for 2025.

Also check:

- The employee names match exactly in both files.
- Salary values are numeric and greater than zero.
- The salary-year input was provided for month-only salary headers.
- At least one category is configured as billable.

### Audit shows missing salary

The audit intentionally marks unmatched periods as missing. Upload salary data for the same year and months as the timesheet.

### No projects appear

Check that the project workbook contains reference code and price columns, and that the header row is within the first 16 rows.

### Upload warnings appear

Warnings identify sheets or rows that could not be recognized. Correct the column names or month values and upload again.

### Build reports a missing page or route artifact

Clear generated Next.js output and rebuild:

```powershell
Remove-Item -Recurse -Force .next
npm run build
```

### Node SQLite error

Use Node.js 22 or newer. The application depends on the built-in `node:sqlite` module and does not use a third-party SQLite package.

## Project Structure

```text
src/
  app/
    page.tsx                  Root redirect to dashboard
    dashboard/page.tsx        Company dashboard
    projects/                 Project list and detail
    productivity/page.tsx     Employee productivity
    categories/page.tsx       Category breakdown
    departments/              Department list and drill-down
    matrix/page.tsx           Employee-category matrix
    comparison/page.tsx       Multi-year comparison
    audit/page.tsx            Cost-rate audit
    upload/page.tsx           Spreadsheet and demo loading UI
    settings/page.tsx         Calculation assumptions
    api/                      Next.js route handlers
  components/                 Shared UI components
  lib/
    db.ts                     SQLite schema, demo seed, reset helpers
    calculations.ts           Cost, revenue, margin, and reporting logic
    utils.ts                  Formatting helpers
    parsers/                  Excel parsing logic
```

## Validation

Run the production build before submission:

```powershell
npm run build
```

The build checks TypeScript, route compilation, page generation, and server imports. The project currently has no automated test suite configured in `package.json`.

For the assignment self-check:

1. Ensure salary and timesheet data have matching year/month periods.
2. Set monthly overhead to `0` in Settings.
3. Select the full year on the Dashboard.
4. Compare company-wide total cost with the sum of salaries for that year.
5. Investigate dashboard warnings if the values do not reconcile.

## Limitations

- Data is stored locally in one SQLite file; there is no authentication or multi-user access control.
- Spreadsheet replacement uploads upsert matching rows but do not remove rows omitted from the replacement file.
- Salary month-only headers require a year supplied through the Upload UI.
- There is no automated test suite yet.
- CSV export is client-side and exports the visible table data.
