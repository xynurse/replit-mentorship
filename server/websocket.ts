import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { Request, RequestHandler } from "express";
import { storage } from "./storage";

const onlineUsers = new Map<string, Set<string>>();
const typingUsers = new Map<string, Set<string>>();

export function setupWebSocket(httpServer: HTTPServer, sessionMiddleware: RequestHandler) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? false : "*",
      credentials: true,
    },
    path: "/socket.io",
  });

  io.use((socket, next) => {
    sessionMiddleware(socket.request as Request, {} as any, (err?: any) => {
      if (err) next(err);
      else next();
    });
  });

  io.use((socket, next) => {
    const session = (socket.request as any).session;
    if (session?.passport?.user) {
      (socket as any).userId = session.passport.user;
      next();
    } else {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = (socket as any).userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    const user = await storage.getUser(userId);
    const conversations = await storage.getUserConversations(userId);
    
    for (const conv of conversations) {
      socket.join(`conversation:${conv.id}`);
    }

    socket.join(`user:${userId}`);

    io.emit("user:online", { userId, name: user ? `${user.firstName} ${user.lastName}` : "User" });

    socket.on("conversation:join", async (conversationId: string) => {
      const conv = await storage.getConversation(conversationId);
      if (conv) {
        const participants = await storage.getConversationParticipants(conversationId);
        if (participants.some(p => p.userId === userId)) {
          socket.join(`conversation:${conversationId}`);
        }
      }
    });

    socket.on("conversation:leave", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("message:send", async (data: { conversationId: string; content: string; replyToId?: string }) => {
      try {
        const participants = await storage.getConversationParticipants(data.conversationId);
        if (!participants.some(p => p.userId === userId)) {
          socket.emit("error", { message: "Not authorized to send to this conversation" });
          return;
        }

        const message = await storage.createMessage({
          conversationId: data.conversationId,
          senderId: userId,
          content: data.content,
          messageType: "TEXT",
          replyToId: data.replyToId,
        });

        const sender = await storage.getUser(userId);
        const fullMessage = {
          ...message,
          sender: sender ? { id: sender.id, firstName: sender.firstName, lastName: sender.lastName, profileImage: sender.profileImage } : null,
          attachments: [],
        };

        io.to(`conversation:${data.conversationId}`).emit("message:new", fullMessage);

        for (const p of participants) {
          if (p.userId !== userId) {
            io.to(`user:${p.userId}`).emit("notification:unread", {
              conversationId: data.conversationId,
              messageId: message.id,
            });
          }
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("message:edit", async (data: { messageId: string; content: string }) => {
      try {
        const message = await storage.getMessage(data.messageId);
        if (message && message.senderId === userId) {
          const updated = await storage.updateMessage(data.messageId, { content: data.content });
          if (updated) {
            io.to(`conversation:${message.conversationId}`).emit("message:updated", updated);
          }
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to edit message" });
      }
    });

    socket.on("message:delete", async (data: { messageId: string }) => {
      try {
        const message = await storage.getMessage(data.messageId);
        if (message && message.senderId === userId) {
          await storage.deleteMessage(data.messageId);
          io.to(`conversation:${message.conversationId}`).emit("message:deleted", { messageId: data.messageId });
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    socket.on("message:reaction", async (data: { messageId: string; emoji: string; add: boolean }) => {
      try {
        const message = await storage.getMessage(data.messageId);
        if (message) {
          const participants = await storage.getConversationParticipants(message.conversationId);
          if (!participants.some(p => p.userId === userId)) {
            socket.emit("error", { message: "Not authorized to react in this conversation" });
            return;
          }

          const reactions = (message.reactions as Record<string, string[]>) || {};
          if (data.add) {
            if (!reactions[data.emoji]) reactions[data.emoji] = [];
            if (!reactions[data.emoji].includes(userId)) {
              reactions[data.emoji].push(userId);
            }
          } else {
            if (reactions[data.emoji]) {
              reactions[data.emoji] = reactions[data.emoji].filter(id => id !== userId);
              if (reactions[data.emoji].length === 0) {
                delete reactions[data.emoji];
              }
            }
          }
          await storage.updateMessage(data.messageId, { reactions });
          io.to(`conversation:${message.conversationId}`).emit("message:reaction", {
            messageId: data.messageId,
            reactions,
          });
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to update reaction" });
      }
    });

    socket.on("typing:start", (conversationId: string) => {
      if (!typingUsers.has(conversationId)) {
        typingUsers.set(conversationId, new Set());
      }
      typingUsers.get(conversationId)!.add(userId);
      socket.to(`conversation:${conversationId}`).emit("typing:update", {
        conversationId,
        userIds: Array.from(typingUsers.get(conversationId) || []),
      });
    });

    socket.on("typing:stop", (conversationId: string) => {
      if (typingUsers.has(conversationId)) {
        typingUsers.get(conversationId)!.delete(userId);
        socket.to(`conversation:${conversationId}`).emit("typing:update", {
          conversationId,
          userIds: Array.from(typingUsers.get(conversationId) || []),
        });
      }
    });

    socket.on("messages:read", async (conversationId: string) => {
      try {
        await storage.markMessagesAsRead(conversationId, userId);
        socket.to(`conversation:${conversationId}`).emit("messages:read", {
          conversationId,
          userId,
          readAt: new Date().toISOString(),
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    });

    socket.on("disconnect", () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit("user:offline", { userId });
        }
      }

      Array.from(typingUsers.entries()).forEach(([convId, users]) => {
        if (users.has(userId)) {
          users.delete(userId);
          io.to(`conversation:${convId}`).emit("typing:update", {
            conversationId: convId,
            userIds: Array.from(users),
          });
        }
      });
    });
  });

  return io;
}

export function getOnlineUsers(): string[] {
  return Array.from(onlineUsers.keys());
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
}
