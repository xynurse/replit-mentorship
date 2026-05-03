import type { IncomingMessage, ServerResponse } from "http";
// Pre-bundled by scripts/build-server.ts before Vercel's function bundler runs.
// Importing the .mjs (instead of ../server/app) avoids @vercel/node's strict
// ESM resolution choking on directory imports and missing extensions.
// @ts-expect-error -- generated artifact, no .d.ts
import { createApp } from "../dist/server.mjs";

let appPromise: ReturnType<typeof createApp> | undefined;

function getApp() {
  if (!appPromise) {
    appPromise = createApp({ serveClient: "none" });
  }
  return appPromise;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    const { app } = await getApp();
    return (app as (req: IncomingMessage, res: ServerResponse) => void)(
      req,
      res,
    );
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        error: "function failed",
        message: err?.message ?? String(err),
        stack: err?.stack,
      }),
    );
  }
}

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};
