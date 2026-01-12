import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMessaging, MessagingProvider } from "@/hooks/use-messaging";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Send,
  MoreVertical,
  Edit,
  Trash2,
  Reply,
  Check,
  CheckCheck,
  Circle,
  MessageSquare,
  Users,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface NewMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelected: (userId: string) => void;
}

function NewMessageDialog({ isOpen, onClose, onUserSelected }: NewMessageDialogProps) {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/all"],
    enabled: isOpen,
    queryFn: async () => {
      const res = await fetch("/api/users/messageable", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });
  
  const filteredUsers = allUsers.filter(u => {
    if (u.id === currentUser?.id) return false;
    if (!searchQuery) return true;
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           u.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const handleSelectUser = (userId: string) => {
    onUserSelected(userId);
    onClose();
    setSearchQuery("");
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>Select a user to start a conversation</DialogDescription>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-users-message"
          />
        </div>
        
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u.id)}
                  className="flex items-center gap-3 p-3 rounded-md hover-elevate active-elevate-2 w-full text-left"
                  data-testid={`button-select-user-${u.id}`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={u.profileImage || undefined} />
                    <AvatarFallback>
                      {u.firstName?.[0]}{u.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {u.email}
                    </p>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">
                    {u.role}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ConversationList() {
  const { conversations, isLoadingConversations, activeConversation, setActiveConversation, onlineUsers, startDirectConversation } = useMessaging();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  
  const handleStartConversation = async (recipientId: string) => {
    try {
      const conversation = await startDirectConversation(recipientId);
      setActiveConversation(conversation);
    } catch (error) {
      toast({ title: "Failed to start conversation", variant: "destructive" });
    }
  };

  const getConversationName = (conv: typeof conversations[0]) => {
    if (conv.name) return conv.name;
    if (conv.type === "DIRECT") {
      const otherParticipant = conv.participants.find(p => p.userId !== user?.id);
      if (otherParticipant?.user) {
        return `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
      }
    }
    return "Unknown";
  };

  const getConversationAvatar = (conv: typeof conversations[0]) => {
    if (conv.type === "DIRECT") {
      const otherParticipant = conv.participants.find(p => p.userId !== user?.id);
      return otherParticipant?.user?.profileImage;
    }
    return null;
  };

  const getInitials = (conv: typeof conversations[0]) => {
    const name = getConversationName(conv);
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isOnline = (conv: typeof conversations[0]) => {
    if (conv.type === "DIRECT") {
      const otherParticipant = conv.participants.find(p => p.userId !== user?.id);
      return otherParticipant ? onlineUsers.has(otherParticipant.userId) : false;
    }
    return false;
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    return getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoadingConversations) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-conversations"
            />
          </div>
          <Button
            onClick={() => setShowNewMessageDialog(true)}
            size="icon"
            data-testid="button-new-message"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <NewMessageDialog
        isOpen={showNewMessageDialog}
        onClose={() => setShowNewMessageDialog(false)}
        onUserSelected={handleStartConversation}
      />
      
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center text-muted-foreground p-6">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <Button 
                className="mt-4" 
                onClick={() => setShowNewMessageDialog(true)}
                data-testid="button-start-first-conversation"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start a Conversation
              </Button>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv)}
                className={`flex items-center gap-3 p-3 rounded-md text-left hover-elevate active-elevate-2 w-full ${
                  activeConversation?.id === conv.id ? "bg-accent" : ""
                }`}
                data-testid={`button-conversation-${conv.id}`}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getConversationAvatar(conv) || undefined} />
                    <AvatarFallback>{getInitials(conv)}</AvatarFallback>
                  </Avatar>
                  {conv.type === "DIRECT" && isOnline(conv) && (
                    <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{getConversationName(conv)}</span>
                    {conv.lastMessage?.createdAt && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage?.content || "No messages yet"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge variant="default" className="flex-shrink-0 h-5 min-w-5 flex items-center justify-center p-0 px-1">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function MessageThread() {
  const { activeConversation, setActiveConversation, messages, isLoadingMessages, sendMessage, startTyping, stopTyping, markAsRead, typingUsers, onlineUsers, editMessage, deleteMessage } = useMessaging();
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeConversation) {
      markAsRead();
    }
  }, [activeConversation, messages.length, markAsRead]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return;
    stopTyping();
    await sendMessage(inputValue.trim());
    setInputValue("");
    inputRef.current?.focus();
  }, [inputValue, sendMessage, stopTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    startTyping();
  };

  const handleEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  const handleSaveEdit = () => {
    if (editingMessageId && editContent.trim()) {
      editMessage(editingMessageId, editContent.trim());
      setEditingMessageId(null);
      setEditContent("");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const getConversationName = () => {
    if (!activeConversation) return "";
    if (activeConversation.name) return activeConversation.name;
    if (activeConversation.type === "DIRECT") {
      const otherParticipant = activeConversation.participants.find(p => p.userId !== user?.id);
      if (otherParticipant?.user) {
        return `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
      }
    }
    return "Unknown";
  };

  const isOtherOnline = () => {
    if (!activeConversation || activeConversation.type !== "DIRECT") return false;
    const otherParticipant = activeConversation.participants.find(p => p.userId !== user?.id);
    return otherParticipant ? onlineUsers.has(otherParticipant.userId) : false;
  };

  const getTypingText = () => {
    if (!activeConversation) return null;
    const typing = typingUsers.get(activeConversation.id);
    if (!typing || typing.size === 0) return null;
    
    const typingNames = Array.from(typing)
      .filter(id => id !== user?.id)
      .map(id => {
        const participant = activeConversation.participants.find(p => p.userId === id);
        return participant?.user?.firstName || "Someone";
      });
    
    if (typingNames.length === 0) return null;
    if (typingNames.length === 1) return `${typingNames[0]} is typing...`;
    return `${typingNames.join(", ")} are typing...`;
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-3 border-b">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setActiveConversation(null)}
          data-testid="button-back-to-list"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{getConversationName()[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium" data-testid="text-conversation-name">{getConversationName()}</p>
            {activeConversation.type === "DIRECT" && (
              <p className="text-xs text-muted-foreground">
                {isOtherOnline() ? "Online" : "Offline"}
              </p>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-conversation-menu">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem data-testid="menuitem-view-details">
              <Users className="h-4 w-4 mr-2" />
              View details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoadingMessages ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "justify-end" : ""}`}>
                {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
                <Skeleton className={`h-16 w-48 rounded-lg`} />
                {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwn = message.senderId === user?.id;
              const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId;
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 group ${isOwn ? "justify-end" : ""}`}
                  data-testid={`message-${message.id}`}
                >
                  {!isOwn && showAvatar && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={message.sender.profileImage || undefined} />
                      <AvatarFallback>
                        {message.sender.firstName?.[0]}{message.sender.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}
                  
                  <div className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                    {showAvatar && !isOwn && (
                      <span className="text-xs text-muted-foreground">
                        {message.sender.firstName} {message.sender.lastName}
                      </span>
                    )}
                    
                    {editingMessageId === message.id ? (
                      <div className="flex gap-2 items-center">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          className="min-w-48"
                          autoFocus
                        />
                        <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex items-end gap-2">
                        {isOwn && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(message.id, message.content)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteMessage(message.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        
                        <div
                          className={`rounded-lg px-3 py-2 ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        
                        {!isOwn && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Reply className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>Reply</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      {message.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                      )}
                      {message.isEdited && (
                        <span className="text-xs text-muted-foreground">(edited)</span>
                      )}
                      {isOwn && (
                        <span className="text-xs text-muted-foreground">
                          <CheckCheck className="h-3 w-3 inline" />
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isOwn && showAvatar && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={user?.profileImage || undefined} />
                      <AvatarFallback>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {getTypingText() && (
          <div className="text-sm text-muted-foreground mt-2 italic">
            {getTypingText()}
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            data-testid="input-message"
          />
          <Button onClick={handleSend} disabled={!inputValue.trim()} data-testid="button-send-message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessagesContent() {
  const { activeConversation } = useMessaging();
  
  return (
    <div className="flex h-full">
      <div className={`w-full md:w-80 border-r flex-shrink-0 ${activeConversation ? "hidden md:flex" : "flex"} flex-col`}>
        <div className="p-3 border-b flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h1 className="font-semibold">Messages</h1>
        </div>
        <ConversationList />
      </div>
      
      <div className={`flex-1 flex flex-col ${!activeConversation ? "hidden md:flex" : "flex"}`}>
        <MessageThread />
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <DashboardLayout>
      <MessagingProvider>
        <MessagesContent />
      </MessagingProvider>
    </DashboardLayout>
  );
}
