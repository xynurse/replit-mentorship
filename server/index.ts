// Local development entry. Vercel deployments use api/index.ts instead.
//
// Auto-seed has moved to scripts/seed-prod.ts — run it once after the
// database is provisioned, not on every boot.

import { createApp, log } from "./app";

const isProduction = process.env.NODE_ENV === "production";

(async () => {
  const { httpServer } = await createApp({
    serveClient: isProduction ? "static" : "vite-dev",
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
  });
})();
