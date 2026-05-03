// One-shot production seed. Run AFTER the database is provisioned and
// schema is pushed (npm run db:push), and BEFORE first user traffic.
//
//   npx tsx scripts/seed-prod.ts
//
// Idempotent — safe to re-run; each helper checks for existing rows.

import {
  autoSeedIfEmpty,
  ensureRequiredUsers,
  ensureCommunityCategories,
  ensurePrograms,
  ensurePublicDocumentsInSystemFolder,
} from "../server/auto-seed";

async function main() {
  console.log("[seed-prod] starting");
  await autoSeedIfEmpty();
  await ensureRequiredUsers();
  await ensureCommunityCategories();
  await ensurePrograms();
  await ensurePublicDocumentsInSystemFolder();
  console.log("[seed-prod] done");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed-prod] failed", err);
    process.exit(1);
  });
