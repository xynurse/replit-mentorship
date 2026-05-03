// One-shot read-only diagnostic for login issues.
// Run: tsx scripts/auth-diag.ts
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const summary = await pool.query<{
    total: string;
    active: string;
    locked: string;
    no_password: string;
    bad_hash_format: string;
  }>(`
    SELECT
      COUNT(*)::text AS total,
      COUNT(*) FILTER (WHERE is_active = true)::text AS active,
      COUNT(*) FILTER (WHERE locked_until IS NOT NULL AND locked_until > NOW())::text AS locked,
      COUNT(*) FILTER (WHERE password IS NULL OR password = '')::text AS no_password,
      COUNT(*) FILTER (WHERE password IS NOT NULL AND password NOT LIKE '%.%')::text AS bad_hash_format
    FROM users
  `);
  console.log("user table summary:", summary.rows[0]);

  const admins = await pool.query<{
    email: string;
    role: string;
    is_active: boolean;
    locked_until: Date | null;
    failed: number | null;
    has_password: boolean;
    pw_format: string;
  }>(`
    SELECT
      email,
      role,
      is_active,
      locked_until,
      failed_login_attempts AS failed,
      (password IS NOT NULL AND password <> '') AS has_password,
      CASE
        WHEN password LIKE '%.%' THEN 'scrypt_hex.salt'
        WHEN password LIKE '$2%' THEN 'bcrypt'
        WHEN password LIKE '$argon2%' THEN 'argon2'
        ELSE 'unknown'
      END AS pw_format
    FROM users
    WHERE role IN ('SUPER_ADMIN', 'ADMIN')
    ORDER BY role, email
  `);
  console.log(`\nadmins (${admins.rowCount}):`);
  for (const r of admins.rows) {
    console.log(
      `  ${r.role.padEnd(11)} ${r.email.padEnd(40)} active=${r.is_active} hasPw=${r.has_password} fmt=${r.pw_format} locked=${!!r.locked_until} failed=${r.failed ?? 0}`,
    );
  }

  const recent = await pool.query<{
    email: string;
    role: string;
    last_login_at: Date | null;
  }>(`
    SELECT email, role, last_login_at
    FROM users
    WHERE last_login_at IS NOT NULL
    ORDER BY last_login_at DESC
    LIMIT 5
  `);
  console.log(`\nlast 5 successful logins (pre-migration):`);
  for (const r of recent.rows) {
    console.log(`  ${r.email.padEnd(40)} ${r.last_login_at?.toISOString()}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("auth-diag failed:", err.message);
  process.exit(1);
});
