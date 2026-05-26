import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import * as Ably from "ably";
import type { Conversation, Message, User, ConversationParticipant } from "@shared/schema";

type MessageWithSender = Message & {
  sender: Pick<User, "id" | "firstName" | "lastName" | "profileImage">;
  attachments?: any[];
};

type ConversationWithDetails = Conversation & {
  participants: (ConversationParticipant & {
    user: Pick<User, "id" | "firstName" | "lastName" | "profileImage">;
  })[];
  lastMessage?: MessageWithSender;
  unreadCount: number;
};

interface MessagingContextType {
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Map<string, Set<string>>;
  conversations: ConversationWithDetails[];
  isLoadingConversations: boolean;
  activeConversation: ConversationWithDetails | null;
  setActiveConversation: (conversation: ConversationWithDetails | null) => void;
  messages: MessageWithSender[];
  isLoadingMessages: boolean;
  sendMessage: (content: string, replyToId?: string) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  markAsRead: () => void;
  startDirectConversation: (recipientId: string) => Promise<ConversationWithDetails>;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => Promise<void>;
}

const MessagingContext = createContext<MessagingContextType | null>(null);

const PRESENCE_CHANNEL = "presence:online";

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const conversationChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());
  const [activeConversation, setActiveConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery<ConversationWithDetails[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  const { isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/conversations", activeConversation?.id, "messages"],
    enabled: !!activeConversation,
    queryFn: async () => {
      if (!activeConversation) return [];
      const res = await fetch(`/api/conversations/${activeConversation.id}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
  });

  useEffect(() => {
    if (activeConversation) {
      refetchMessages().then(({ data }) => {
        if (data) setMessages(data);
      });
    } else {
      setMessages([]);
    }
  }, [activeConversation, refetchMessages]);

  // Connect to Ably (one Realtime instance per user session).
  useEffect(() => {
    if (!user) {
      if (ablyRef.current) {
        ablyRef.current.close();
        ablyRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const client = new Ably.Realtime({
      authUrl: "/api/ably/auth",
      authMethod: "POST",
    });
    ablyRef.current = client;

    client.connection.on("connected", () => setIsConnected(true));
    client.connection.on("disconnected", () => setIsConnected(false));
    client.connection.on("failed", (err) => {
      console.error("[ably] connection failed:", err);
      setIsConnected(false);
    });

    // Subscribe to this user's notification channel.
    const userChan = client.channels.get(`user:${user.id}`);
    userChan.subscribe("notification:new", () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    });

    // Presence: enter on connect, watch enter/leave to maintain onlineUsers.
    const presenceChan = client.channels.get(PRESENCE_CHANNEL);
    presenceChan.presence.subscribe("enter", (member) => {
      if (member.clientId) {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.add(member.clientId!);
          return next;
        });
      }
    });
    presenceChan.presence.subscribe("leave", (member) => {
      if (member.clientId) {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(member.clientId!);
          return next;
        });
      }
    });
    presenceChan.presence
      .get()
      .then((members) => {
        const ids = members
          .map((m) => m.clientId)
          .filter((id): id is string => !!id);
        setOnlineUsers(new Set(ids));
      })
      .catch((err) => console.error("[ably] presence.get failed:", err));
    presenceChan.presence
      .enter()
      .catch((err) => console.error("[ably] presence.enter failed:", err));

    return () => {
      presenceChan.presence.leave().catch(() => {});
      userChan.unsubscribe();
      client.close();
      ablyRef.current = null;
      setIsConnected(false);
    };
  }, [user, queryClient]);

  // Subscribe/unsubscribe to the active conversation channel.
  useEffect(() => {
    const client = ablyRef.current;
    if (!client || !activeConversation) {
      conversationChannelRef.current = null;
      return;
    }

    const chan = client.channels.get(`conversation:${activeConversation.id}`);
    conversationChannelRef.current = chan;

    const onNew = (msg: Ably.InboundMessage) => {
      const message = msg.data as MessageWithSender;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        const tempIdx = prev.findIndex(
          (m) =>
            typeof m.id === "string" &&
            m.id.startsWith("temp-") &&
            m.senderId === message.senderId &&
            m.content === message.content &&
            m.conversationId === message.conversationId,
        );
        if (tempIdx >= 0) {
          const next = [...prev];
          next[tempIdx] = message;
          return next;
        }
        return [...prev, message];
      });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    };

    const onEdited = (msg: Ably.InboundMessage) => {
      const message = msg.data as MessageWithSender;
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
    };

    const onDeleted = (msg: Ably.InboundMessage) => {
      const { messageId } = msg.data as { messageId: string };
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    const onReaction = (msg: Ably.InboundMessage) => {
      const { messageId, reactions } = msg.data as { messageId: string; reactions: any };
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
    };

    const onTypingStart = (msg: Ably.InboundMessage) => {
      const { userId } = msg.data as { userId: string };
      if (userId === user?.id) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        const users = next.get(activeConversation.id) || new Set<string>();
        users.add(userId);
        next.set(activeConversation.id, users);
        return next;
      });
    };

    const onTypingStop = (msg: Ably.InboundMessage) => {
      const { userId } = msg.data as { userId: string };
      setTypingUsers((prev) => {
        const next = new Map(prev);
        const users = next.get(activeConversation.id);
        if (users) {
          users.delete(userId);
          if (users.size === 0) next.delete(activeConversation.id);
          else next.set(activeConversation.id, users);
        }
        return next;
      });
    };

    const onRead = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    };

    chan.subscribe("message:new", onNew);
    chan.subscribe("message:edited", onEdited);
    chan.subscribe("message:deleted", onDeleted);
    chan.subscribe("message:reaction", onReaction);
    chan.subscribe("typing:start", onTypingStart);
    chan.subscribe("typing:stop", onTypingStop);
    chan.subscribe("messages:read", onRead);

    return () => {
      chan.unsubscribe();
      conversationChannelRef.current = null;
    };
  }, [activeConversation, user?.id, queryClient]);

  const sendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      if (!activeConversation || !user) return;

      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        conversationId: activeConversation.id,
        senderId: user.id,
        content,
        messageType: "TEXT" as const,
        replyToId: replyToId || null,
        isEdited: false,
        editedAt: null,
        isDeleted: false,
        deletedAt: null,
        isPinned: false,
        reactions: {},
        metadata: {},
        createdAt: new Date().toISOString(),
        sender: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
        },
        attachments: [],
      };

      setMessages((prev) => [...prev, optimisticMessage as any]);

      try {
        const res = await apiRequest("POST", `/api/conversations/${activeConversation.id}/messages`, {
          content,
          replyToId,
        });
        const message = await res.json();
        // Ably will deliver the real message; meanwhile patch in-place
        // so the optimistic row gets the real id immediately for the sender.
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMessage.id ? message : m)),
        );
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      } catch (error) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      }
    },
    [activeConversation, user, queryClient],
  );

  const publishTyping = useCallback(
    (event: "typing:start" | "typing:stop") => {
      const chan = conversationChannelRef.current;
      if (!chan || !user) return;
      chan.publish(event, { userId: user.id }).catch(() => {});
    },
    [user],
  );

  const startTyping = useCallback(() => {
    if (!activeConversation) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    publishTyping("typing:start");
    typingTimeoutRef.current = setTimeout(() => publishTyping("typing:stop"), 3000);
  }, [activeConversation, publishTyping]);

  const stopTyping = useCallback(() => {
    if (!activeConversation) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    publishTyping("typing:stop");
  }, [activeConversation, publishTyping]);

  const markAsRead = useCallback(async () => {
    if (!activeConversation) return;
    await apiRequest("POST", `/api/conversations/${activeConversation.id}/read`, {});
    queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
  }, [activeConversation, queryClient]);

  const startDirectConversation = useCallback(
    async (recipientId: string): Promise<ConversationWithDetails> => {
      const res = await apiRequest("POST", "/api/conversations/direct", { recipientId });
      const conversation = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      return conversation;
    },
    [queryClient],
  );

  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!activeConversation) return;
      try {
        await apiRequest("POST", `/api/messages/${messageId}/reactions`, { emoji });
      } catch (err) {
        console.error("addReaction failed:", err);
      }
    },
    [activeConversation],
  );

  const removeReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!activeConversation) return;
      try {
        await apiRequest("DELETE", `/api/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
      } catch (err) {
        console.error("removeReaction failed:", err);
      }
    },
    [activeConversation],
  );

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!activeConversation) return;
      try {
        await apiRequest("PATCH", `/api/messages/${messageId}`, { content });
      } catch (err) {
        console.error("editMessage failed:", err);
      }
    },
    [activeConversation],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!activeConversation) return;
      try {
        await apiRequest("DELETE", `/api/conversations/${activeConversation.id}/messages/${messageId}`);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    },
    [activeConversation],
  );

  return (
    <MessagingContext.Provider
      value={{
        isConnected,
        onlineUsers,
        typingUsers,
        conversations,
        isLoadingConversations,
        activeConversation,
        setActiveConversation,
        messages,
        isLoadingMessages,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead,
        startDirectConversation,
        addReaction,
        removeReaction,
        editMessage,
        deleteMessage,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used within a MessagingProvider");
  }
  return context;
}
