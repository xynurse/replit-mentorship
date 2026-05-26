/**
 * Ably real-time integration. Replaces the Phase 1 socket.io stub.
 *
 * Channel layout:
 *   user:<userId>          — server publishes notification:* events here;
 *                            client subscribes to their own.
 *   conversation:<id>      — server publishes message:* and messages:read;
 *                            clients also publish typing:* directly (transient).
 *   presence:online        — Ably presence; clients enter on connect.
 *
 * Server uses the REST client with the master API key for publishing.
 * Clients receive scoped tokens via POST /api/ably/auth — see issueClientToken().
 *
 * Designed to no-op gracefully when ABLY_API_KEY is missing so dev builds
 * without a key still boot. A single warning is logged on first call.
 */

import Ably from "ably";

const REALTIME_DISABLED_LOG_ONCE = (() => {
  let logged = false;
  return () => {
    if (!logged && process.env.NODE_ENV !== "test") {
      logged = true;
      console.warn(
        "[realtime] ABLY_API_KEY is not set — real-time events are no-op",
      );
    }
  };
})();

let restClientCache: Ably.Rest | null = null;
function getRestClient(): Ably.Rest | null {
  if (restClientCache) return restClientCache;
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    REALTIME_DISABLED_LOG_ONCE();
    return null;
  }
  restClientCache = new Ably.Rest({ key: apiKey });
  return restClientCache;
}

async function publish(channelName: string, event: string, data: unknown): Promise<void> {
  const client = getRestClient();
  if (!client) return;
  try {
    const channel = client.channels.get(channelName);
    await channel.publish(event, data);
  } catch (err) {
    console.error(`[realtime] publish ${channelName}/${event} failed:`, err);
  }
}

export function userChannel(userId: string): string {
  return `user:${userId}`;
}

export function conversationChannel(conversationId: string): string {
  return `conversation:${conversationId}`;
}

// ----- Notifications -----

export function emitNotification(userId: string, notification: unknown): void {
  void publish(userChannel(userId), "notification:new", notification);
}

export function emitNotificationCountUpdate(userId: string, count: number): void {
  void publish(userChannel(userId), "notification:count", { count });
}

// ----- Conversation events (server publishes after persisting) -----

export function emitMessageNew(conversationId: string, message: unknown): void {
  void publish(conversationChannel(conversationId), "message:new", message);
}

export function emitMessageEdited(conversationId: string, message: unknown): void {
  void publish(conversationChannel(conversationId), "message:edited", message);
}

export function emitMessageDeleted(conversationId: string, messageId: string): void {
  void publish(conversationChannel(conversationId), "message:deleted", { messageId });
}

export function emitMessageReaction(
  conversationId: string,
  messageId: string,
  reactions: unknown,
): void {
  void publish(conversationChannel(conversationId), "message:reaction", {
    messageId,
    reactions,
  });
}

export function emitMessagesRead(
  conversationId: string,
  userId: string,
  readAt: string,
): void {
  void publish(conversationChannel(conversationId), "messages:read", {
    conversationId,
    userId,
    readAt,
  });
}

// ----- Client token issuance -----
//
// Per-user token. clientId is bound to the authenticated user so presence
// events identify the right user. Capability grants:
//   - subscribe on their own user channel (notifications)
//   - subscribe + publish + presence on any conversation:* (publish is
//     needed only for transient typing events; state-changing ops go
//     through REST so the server can persist before publishing). Conversation
//     IDs are unguessable UUIDs, so wide capability here is acceptable —
//     same security model as our Blob URLs.
//   - presence on the global online channel

export interface IssuedClientToken {
  token?: string;
  keyName?: string;
  capability?: string;
  clientId?: string;
  timestamp?: number;
  expires?: number;
  // Ably's TokenRequest shape; we forward it verbatim to the client.
  [key: string]: unknown;
}

export async function issueClientToken(userId: string): Promise<IssuedClientToken | null> {
  const client = getRestClient();
  if (!client) return null;

  const capability = {
    [userChannel(userId)]: ["subscribe"],
    "conversation:*": ["subscribe", "publish", "presence"],
    "presence:online": ["presence", "subscribe"],
  };

  const tokenRequest = await client.auth.createTokenRequest({
    clientId: userId,
    capability: JSON.stringify(capability),
    ttl: 60 * 60 * 1000, // 1 hour
  });

  return tokenRequest as unknown as IssuedClientToken;
}

// ----- Legacy compatibility stubs -----
//
// Phase 1 exposed setupWebSocket / getOnlineUsers / isUserOnline from
// server/websocket.ts. We keep them as no-op exports so any straggling
// imports compile, but real presence lives in Ably and is queried by the
// client (not the server) — there's no server-side mirror of presence
// state any more.

import type { Server as HTTPServer } from "http";
import type { RequestHandler } from "express";

export function setupWebSocket(_httpServer: HTTPServer, _sessionMiddleware: RequestHandler) {
  return null;
}

export function getOnlineUsers(): string[] {
  return [];
}

export function isUserOnline(_userId: string): boolean {
  return false;
}
