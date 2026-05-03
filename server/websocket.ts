// Phase 1 stub: socket.io cannot run on Vercel Functions (no persistent
// connections). Phase 2 will replace this with Ably.
//
// Until then, every export here is a safe no-op so route handlers that
// import emitNotification/emitNotificationCountUpdate keep compiling and
// running. Real-time UI features (typing indicators, online presence,
// live message delivery) will be silent until Ably is wired in.
//
// To restore the original implementation, see the git history of this file
// in the replit-mentorship repo (server/websocket.ts pre-migration).

import type { Server as HTTPServer } from "http";
import type { RequestHandler } from "express";

const REALTIME_DISABLED_LOG_ONCE = (() => {
  let logged = false;
  return () => {
    if (!logged && process.env.NODE_ENV !== "test") {
      logged = true;
      console.warn(
        "[realtime] socket.io is disabled in this build — Phase 2 (Ably) not yet wired in",
      );
    }
  };
})();

export function setupWebSocket(_httpServer: HTTPServer, _sessionMiddleware: RequestHandler) {
  REALTIME_DISABLED_LOG_ONCE();
  return null;
}

export function getOnlineUsers(): string[] {
  return [];
}

export function isUserOnline(_userId: string): boolean {
  return false;
}

export function emitNotification(_userId: string, _notification: unknown) {
  REALTIME_DISABLED_LOG_ONCE();
}

export function emitNotificationCountUpdate(_userId: string, _count: number) {
  REALTIME_DISABLED_LOG_ONCE();
}
