// Read-only inventory of programs and program memberships.
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const programs = await pool.query<{
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    created_at: Date | null;
    members: string;
  }>(`
    SELECT
      p.id,
      p.name,
      p.slug,
      p.is_active,
      p.created_at,
      (SELECT COUNT(*)::text FROM program_memberships pm WHERE pm.program_id = p.id) AS members
    FROM programs p
    ORDER BY p.created_at NULLS LAST
  `);
  console.log(`programs (${programs.rowCount}):`);
  for (const r of programs.rows) {
    console.log(
      `  ${r.id}  active=${r.is_active}  members=${r.members}  ${r.name}  (slug: ${r.slug})`,
    );
  }

  console.log("\nrows that reference a program (by table):");
  for (const tbl of [
    "program_memberships",
    "cohorts",
    "tracks",
    "documents",
    "folders",
    "mentorship_matches",
  ]) {
    const exists = await pool.query<{ has: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = $1 AND column_name = 'program_id'
      ) AS has`,
      [tbl],
    );
    if (exists.rows[0].has) {
      const counts = await pool.query<{ program_id: string | null; n: string }>(
        `SELECT program_id, COUNT(*)::text AS n FROM ${tbl} GROUP BY program_id ORDER BY n DESC`,
      );
      for (const r of counts.rows) {
        console.log(`  ${tbl.padEnd(22)} program_id=${r.program_id ?? "NULL"} count=${r.n}`);
      }
    } else {
      console.log(`  ${tbl.padEnd(22)} (no program_id column)`);
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error("programs-diag failed:", err.message);
  process.exit(1);
});
