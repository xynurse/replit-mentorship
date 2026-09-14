// Reconcile the pgEnum definitions in shared/schema.ts against a live database.
//
// Additive only: adds enum values the code declares and the database lacks. It never
// drops a value or a type, and never touches tables or columns.
//
//   TARGET_DATABASE_URL='postgres://...' npx tsx scripts/sync-enums.ts           # report
//   TARGET_DATABASE_URL='postgres://...' npx tsx scripts/sync-enums.ts --apply   # write
//
// Dry-run by default. Exits 2 when a dry run finds drift, 0 when in sync or applied,
// 1 on error.
//
// Reads TARGET_DATABASE_URL, not DATABASE_URL, on purpose -- the DATABASE_URL in the
// local .env is a stale pre-cutover database. Get production's string from Neon.

import pg from "pg";
import * as schema from "../shared/schema";

type CodeEnum = { name: string; values: string[] };

const APPLY = process.argv.includes("--apply");

// Row counts that separate production from the stale pre-cutover database, which has
// zero of all three. Printed so the operator can confirm the target before --apply.
const FINGERPRINT_TABLES = ["users", "messages", "coc_acceptances", "program_applications"];

function collectCodeEnums(): CodeEnum[] {
  const found = new Map<string, string[]>();
  for (const exported of Object.values(schema as Record<string, unknown>)) {
    const candidate = exported as { enumName?: unknown; enumValues?: unknown };
    if (typeof candidate?.enumName === "string" && Array.isArray(candidate.enumValues)) {
      found.set(candidate.enumName, candidate.enumValues as string[]);
    }
  }
  return Array.from(found.entries())
    .map(([name, values]) => ({ name, values }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function readDbEnums(pool: pg.Pool): Promise<Map<string, string[]>> {
  const { rows } = await pool.query<{ typname: string; enumlabel: string }>(`
    SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder
  `);
  const byType = new Map<string, string[]>();
  for (const row of rows) {
    const list = byType.get(row.typname) ?? [];
    list.push(row.enumlabel);
    byType.set(row.typname, list);
  }
  return byType;
}

function describeTarget(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return "(unparseable connection string)";
  }
}

async function printFingerprint(pool: pg.Pool) {
  console.log("target fingerprint:");
  for (const table of FINGERPRINT_TABLES) {
    try {
      const { rows } = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${table}`,
      );
      console.log(`  ${table.padEnd(22)} ${rows[0].count}`);
    } catch {
      console.log(`  ${table.padEnd(22)} (table not present)`);
    }
  }
}

async function main() {
  const connectionString = process.env.TARGET_DATABASE_URL;
  if (!connectionString) {
    console.error(
      "TARGET_DATABASE_URL is not set.\n\n" +
        "This script deliberately ignores DATABASE_URL -- the one in the local .env points\n" +
        "at a stale pre-cutover database. Production's connection string is stored Sensitive\n" +
        "on Vercel and cannot be read back with `vercel env pull`; get it from the Neon\n" +
        "dashboard, then:\n\n" +
        "  TARGET_DATABASE_URL='postgres://...' npx tsx scripts/sync-enums.ts",
    );
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString });
  console.log(`[sync-enums] ${APPLY ? "APPLY" : "dry run"} against ${describeTarget(connectionString)}\n`);

  try {
    await printFingerprint(pool);
    console.log("");

    const codeEnums = collectCodeEnums();
    const dbEnums = await readDbEnums(pool);

    const missingValues: Array<{ type: string; value: string }> = [];
    const missingTypes: string[] = [];
    const extraValues: Array<{ type: string; values: string[] }> = [];

    for (const { name, values } of codeEnums) {
      const dbValues = dbEnums.get(name);
      if (!dbValues) {
        missingTypes.push(name);
        continue;
      }
      const dbSet = new Set(dbValues);
      const codeSet = new Set(values);
      for (const value of values) {
        if (!dbSet.has(value)) missingValues.push({ type: name, value });
      }
      const extra = dbValues.filter((v) => !codeSet.has(v));
      if (extra.length > 0) extraValues.push({ type: name, values: extra });
    }

    console.log(`checked ${codeEnums.length} enum types declared in shared/schema.ts\n`);

    if (missingTypes.length > 0) {
      console.log("MISSING TYPES -- declared in code, absent from the database:");
      for (const name of missingTypes) console.log(`  ${name}`);
      console.log("  These cannot be fixed additively. Run `npm run db:push`.\n");
    }

    if (extraValues.length > 0) {
      console.log("EXTRA VALUES -- present in the database, absent from code (informational):");
      for (const { type, values } of extraValues) console.log(`  ${type}: ${values.join(", ")}`);
      console.log("  Never dropped by this script. Removing an enum value requires recreating the type.\n");
    }

    if (missingValues.length === 0) {
      console.log("No missing enum values. Database is in sync with the code.");
      if (missingTypes.length > 0) process.exit(2);
      return;
    }

    console.log("MISSING VALUES -- declared in code, absent from the database:");
    for (const { type, value } of missingValues) console.log(`  ${type}: ${value}`);
    console.log("");

    if (!APPLY) {
      console.log("Dry run -- nothing written. Re-run with --apply to add these.");
      process.exit(2);
    }

    // One statement at a time, outside a transaction. Postgres 12+ allows ADD VALUE in
    // a transaction but forbids using the new value until commit, so keeping these
    // standalone means the value is immediately usable when the script returns.
    for (const { type, value } of missingValues) {
      const sql = `ALTER TYPE "${type}" ADD VALUE IF NOT EXISTS '${value}'`;
      console.log(`  ${sql}`);
      await pool.query(sql);
    }
    console.log("");

    // Re-read rather than trusting the writes.
    const after = await readDbEnums(pool);
    const stillMissing = missingValues.filter(
      ({ type, value }) => !(after.get(type) ?? []).includes(value),
    );
    if (stillMissing.length > 0) {
      console.error("VERIFY FAILED -- still missing after apply:");
      for (const { type, value } of stillMissing) console.error(`  ${type}: ${value}`);
      process.exit(1);
    }

    console.log(`Applied and verified ${missingValues.length} enum value(s).`);
    if (missingTypes.length > 0) process.exit(2);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[sync-enums] failed", err);
  process.exit(1);
});
