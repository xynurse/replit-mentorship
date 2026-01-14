import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { io, Socket } from "socket.io-client";
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
  socket: Socket | null;
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

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());
  const [activeConversation, setActiveConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        if (data) {
          setMessages(data);
        }
      });
    } else {
      setMessages([]);
    }
  }, [activeConversation, refetchMessages]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io({
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    newSocket.on("user:online", ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => new Set(Array.from(prev).concat(userId)));
    });

    newSocket.on("user:offline", ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    newSocket.on("message:new", (message: MessageWithSender) => {
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    });

    newSocket.on("message:edited", (message: MessageWithSender) => {
      setMessages(prev => prev.map(m => m.id === message.id ? message : m));
    });

    newSocket.on("message:deleted", ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    newSocket.on("message:reaction", ({ messageId, reactions }: { messageId: string; reactions: any }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
    });

    newSocket.on("typing:start", ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        const users = next.get(conversationId) || new Set();
        users.add(userId);
        next.set(conversationId, users);
        return next;
      });
    });

    newSocket.on("typing:stop", ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        const users = next.get(conversationId);
        if (users) {
          users.delete(userId);
          if (users.size === 0) {
            next.delete(conversationId);
          } else {
            next.set(conversationId, users);
          }
        }
        return next;
      });
    });

    newSocket.on("messages:read", ({ conversationId, userId, readAt }: { conversationId: string; userId: string; readAt: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user, queryClient]);

  useEffect(() => {
    if (socket && isConnected && activeConversation) {
      socket.emit("conversation:join", { conversationId: activeConversation.id });
      return () => {
        socket.emit("conversation:leave", { conversationId: activeConversation.id });
      };
    }
  }, [socket, isConnected, activeConversation]);

  const sendMessage = useCallback(async (content: string, replyToId?: string) => {
    if (!socket || !isConnected || !activeConversation) {
      const res = await apiRequest("POST", `/api/conversations/${activeConversation?.id}/messages`, {
        content,
        replyToId,
      });
      const message = await res.json();
      setMessages(prev => [...prev, message]);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      return;
    }

    socket.emit("message:send", {
      conversationId: activeConversation.id,
      content,
      replyToId,
    });
  }, [socket, isConnected, activeConversation, queryClient]);

  const startTyping = useCallback(() => {
    if (!socket || !isConnected || !activeConversation) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    socket.emit("typing:start", { conversationId: activeConversation.id });
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { conversationId: activeConversation.id });
    }, 3000);
  }, [socket, isConnected, activeConversation]);

  const stopTyping = useCallback(() => {
    if (!socket || !isConnected || !activeConversation) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    socket.emit("typing:stop", { conversationId: activeConversation.id });
  }, [socket, isConnected, activeConversation]);

  const markAsRead = useCallback(async () => {
    if (!activeConversation) return;
    
    if (socket && isConnected) {
      socket.emit("messages:read", { conversationId: activeConversation.id });
    } else {
      await apiRequest("POST", `/api/conversations/${activeConversation.id}/read`, {});
    }
    queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
  }, [socket, isConnected, activeConversation, queryClient]);

  const startDirectConversation = useCallback(async (recipientId: string): Promise<ConversationWithDetails> => {
    const res = await apiRequest("POST", "/api/conversations/direct", { recipientId });
    const conversation = await res.json();
    queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    return conversation;
  }, [queryClient]);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    if (!socket || !isConnected || !activeConversation) return;
    socket.emit("message:reaction:add", { conversationId: activeConversation.id, messageId, emoji });
  }, [socket, isConnected, activeConversation]);

  const removeReaction = useCallback((messageId: string, emoji: string) => {
    if (!socket || !isConnected || !activeConversation) return;
    socket.emit("message:reaction:remove", { conversationId: activeConversation.id, messageId, emoji });
  }, [socket, isConnected, activeConversation]);

  const editMessage = useCallback((messageId: string, content: string) => {
    if (!socket || !isConnected || !activeConversation) return;
    socket.emit("message:edit", { conversationId: activeConversation.id, messageId, content });
  }, [socket, isConnected, activeConversation]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!activeConversation) return;
    
    if (socket && isConnected) {
      socket.emit("message:delete", { conversationId: activeConversation.id, messageId });
    } else {
      try {
        await apiRequest("DELETE", `/api/conversations/${activeConversation.id}/messages/${messageId}`);
        setMessages(prev => prev.filter(m => m.id !== messageId));
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    }
  }, [socket, isConnected, activeConversation]);

  return (
    <MessagingContext.Provider
      value={{
        socket,
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
