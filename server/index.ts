// Local development entry. Vercel deployments use api/index.ts instead.
//
// Auto-seed has moved to scripts/seed-prod.ts — run it once after the
// database is provisioned, not on every boot.

import { createApp, log } from "./app";

const isProduction = process.env.NODE_ENV === "production";

(async () => {
  const { app, httpServer } = await createApp({
    serveClient: isProduction ? "static" : "none",
  });

  // Vite dev middleware lives here (not in app.ts) so it stays out of the
  // static import graph used to build the Vercel function bundle.
  if (!isProduction) {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
  });
})();
