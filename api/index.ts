import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "../server/app";

// Cache the built Express app across warm invocations on Fluid Compute.
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
  const { app } = await getApp();
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(
    req,
    res,
  );
}

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};
