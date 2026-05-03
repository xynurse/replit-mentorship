import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { createServer, type Server } from "http";
import { registerRoutes } from "./routes";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export interface CreateAppOptions {
  serveClient?: "vite-dev" | "static" | "none";
}

export async function createApp(
  options: CreateAppOptions = {},
): Promise<{ app: Express; httpServer: Server }> {
  const app = express();
  const httpServer = createServer(app);

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined;

    const originalResJson = res.json.bind(res);
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson(bodyJson, ...args);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        log(logLine);
      }
    });

    next();
  });

  await registerRoutes(httpServer, app);

  app.use(
    (err: any, _req: Request, res: Response, _next: NextFunction) => {
      if (err.name === "ZodError") {
        const zodErrors =
          err.errors?.map((e: any) => ({
            path: e.path.join("."),
            message: e.message,
            code: e.code,
          })) || [];
        log(`Validation error: ${JSON.stringify(zodErrors)}`);
        return res
          .status(400)
          .json({ message: "Validation error", errors: zodErrors });
      }

      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      if (status >= 500) {
        console.error(err);
      }
    },
  );

  const mode = options.serveClient ?? "none";
  if (mode === "vite-dev") {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  } else if (mode === "static") {
    const { serveStatic } = await import("./static");
    serveStatic(app);
  }

  return { app, httpServer };
}
