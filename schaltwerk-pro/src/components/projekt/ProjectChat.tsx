"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MessageSquare, X, Send, ChevronUp, ChevronDown, Image as ImageIcon, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ChatMessage, User } from "@/types";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { getAvatarUrl, getDisplayName } from "@/lib/utils";
import { useMarkChatAsRead, useClearChatMessages } from "@/lib/hooks/useChat";

interface ProjectChatProps {
  projektId: string;
  messages: ChatMessage[];
  currentUser?: User;
  lastReadAt?: Date | null;
  onSendMessage?: (text: string, imageUrl?: string) => void;
}

export function ProjectChat({
  projektId,
  messages: initialMessages,
  currentUser,
  lastReadAt: initialLastReadAt,
  onSendMessage,
}: ProjectChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(initialMessages);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [lastReadAt, setLastReadAt] = useState<Date | null>(initialLastReadAt || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const markAsReadMutation = useMarkChatAsRead();
  const clearChatMutation = useClearChatMessages();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Update local messages when initial messages change
  // WICHTIG: Nur mergen, nie komplett ersetzen, um lokale Nachrichten zu behalten
  const isInitialMount = useRef(true);
  useEffect(() => {
    // Beim ersten Mount: Setze initiale Nachrichten
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialMessages && initialMessages.length > 0) {
        setLocalMessages(initialMessages);
      }
      return;
    }
    
    // Nach dem ersten Mount: MERGE statt REPLACE
    if (!initialMessages || initialMessages.length === 0) {
      // Wenn keine initialen Nachrichten, behalte lokale Nachrichten
      return;
    }
    
    // Merge: Kombiniere lokale und initiale Nachrichten
    // Entferne Duplikate basierend auf ID
    const messageMap = new Map<string, ChatMessage>();
    
    // Zuerst lokale Nachrichten (haben Priorität für gerade gesendete)
    localMessages.forEach(msg => {
      messageMap.set(msg.id, msg);
    });
    
    // Dann initiale Nachrichten (überschreiben nur wenn nicht vorhanden)
    initialMessages.forEach(msg => {
      if (!messageMap.has(msg.id)) {
        messageMap.set(msg.id, msg);
      }
    });
    
    // Sortiere nach Timestamp
    const mergedMessages = Array.from(messageMap.values()).sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    // Nur aktualisieren wenn sich wirklich etwas geändert hat
    const hasChanged = 
      mergedMessages.length !== localMessages.length ||
      mergedMessages.some((msg, idx) => {
        const localMsg = localMessages[idx];
        return !localMsg || msg.id !== localMsg.id;
      });
    
    if (hasChanged) {
      setLocalMessages(mergedMessages);
    }
  }, [initialMessages]);

  // Update lastReadAt when it changes from server (nur wenn es sich wirklich ändert)
  useEffect(() => {
    if (initialLastReadAt) {
      // Nur aktualisieren wenn es sich wirklich geändert hat
      if (!lastReadAt || initialLastReadAt.getTime() !== lastReadAt.getTime()) {
        setLastReadAt(initialLastReadAt);
      }
    }
  }, [initialLastReadAt]);

  // Default current user (in real app, this would come from auth context)
  const defaultUser: User = {
    id: "user-1",
    username: "stefan.haering",
    name: "Stefan Häring",
    initialen: "SH",
    rolle: "admin",
  };

  const user = currentUser || defaultUser;

  // Track when chat is opened to mark messages as read
  const hasMarkedAsReadRef = useRef(false);
  useEffect(() => {
    if (isOpen && !isMinimized && !hasMarkedAsReadRef.current) {
      // Wenn Chat geöffnet wird, markiere alle aktuellen Nachrichten als gelesen
      const now = new Date();
      setLastReadAt(now);
      hasMarkedAsReadRef.current = true;
      // API-Call, um Nachrichten als gelesen zu markieren (nur einmal beim Öffnen)
      markAsReadMutation.mutate(projektId);
    } else if (!isOpen) {
      // Reset wenn Chat geschlossen wird
      hasMarkedAsReadRef.current = false;
    }
  }, [isOpen, isMinimized, projektId]);
  
  // Wenn Chat geöffnet ist und neue Nachrichten kommen, aktualisiere lastReadAt
  // damit sie sofort als gelesen markiert werden (aber nicht bei jeder Änderung)
  useEffect(() => {
    if (isOpen && !isMinimized && localMessages.length > 0) {
      // Prüfe ob es neue Nachrichten gibt, die noch nicht als gelesen markiert sind
      const hasUnreadMessages = lastReadAt 
        ? localMessages.some(msg => new Date(msg.timestamp) > lastReadAt && msg.userId !== user.id)
        : localMessages.some(msg => msg.userId !== user.id);
      
      if (hasUnreadMessages) {
        const now = new Date();
        setLastReadAt(now);
        // API-Call, um Nachrichten als gelesen zu markieren (debounced)
        const timeoutId = setTimeout(() => {
          markAsReadMutation.mutate(projektId);
        }, 1000); // 1s Debounce
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [localMessages.length, isOpen, isMinimized, projektId]);

  // Count unread messages (messages after last read time)
  const unreadCount = lastReadAt
    ? localMessages.filter(
        (msg) => new Date(msg.timestamp) > lastReadAt && msg.userId !== user.id
      ).length
    : localMessages.filter((msg) => msg.userId !== user.id).length;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [localMessages, isOpen, isMinimized]);

  // Auto-focus textarea when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      textareaRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = () => {
    if (messageText.trim() || selectedImage) {
      const newMessage: ChatMessage = {
        id: `chat-${Date.now()}`,
        text: messageText.trim() || "",
        userId: user.id,
        projektId,
        timestamp: new Date(),
        user,
        imageUrl: selectedImage || undefined,
      };

      // Add message to local state immediately for instant feedback
      setLocalMessages((prev) => [...prev, newMessage]);
      setMessageText("");
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      textareaRef.current?.focus();

      // Call callback if provided (for server sync in real app)
      if (onSendMessage) {
        onSendMessage(messageText.trim() || "", selectedImage || undefined);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    if (window.confirm("Möchten Sie wirklich alle Chat-Nachrichten für dieses Projekt löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      try {
        await clearChatMutation.mutateAsync(projektId);
        setLocalMessages([]);
        setShowClearConfirm(false);
      } catch (error: any) {
        alert("Fehler beim Löschen der Nachrichten: " + (error.message || "Unbekannter Fehler"));
      }
    }
  };

  const isAdmin = user.rolle === "admin";

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      {!isOpen ? (
        // Chat Button (Collapsed)
        <div className="relative">
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all relative"
          >
            <MessageSquare className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      ) : (
        // Chat Panel (Expanded)
        <Card className="w-96 h-[600px] flex flex-col shadow-2xl border-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Projekt Chat
            </CardTitle>
            <div className="flex gap-1">
              {isAdmin && localMessages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearChat}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Alle Nachrichten löschen (Admin)"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8"
              >
                {isMinimized ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {localMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500 dark:text-muted-foreground text-sm">
                    <p>Noch keine Nachrichten. Starte die Unterhaltung!</p>
                  </div>
                ) : (
                  <>
                    {localMessages.map((message) => {
                      const isOwnMessage = message.userId === user.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            isOwnMessage ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            {message.user && getAvatarUrl(message.user.id) && (
                              <AvatarImage 
                                src={getAvatarUrl(message.user.id)} 
                                alt={message.user.name} 
                              />
                            )}
                            <AvatarFallback className="text-xs">
                              {message.user?.initialen || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`flex flex-col gap-1 max-w-[75%] ${
                              isOwnMessage ? "items-end" : "items-start"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-700 dark:text-foreground">
                                {message.user ? getDisplayName(message.user.id, message.user.name) : "Unbekannt"}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-muted-foreground">
                                {format(message.timestamp, "HH:mm", {
                                  locale: de,
                                })}
                              </span>
                            </div>
                            <div
                              className={`rounded-lg px-3 py-2 text-sm space-y-2 ${
                                isOwnMessage
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 dark:bg-muted text-slate-900 dark:text-foreground"
                              }`}
                            >
                              {message.imageUrl && (
                                <div className="rounded-md overflow-hidden max-w-full">
                                  <img
                                    src={message.imageUrl}
                                    alt="Chat image"
                                    className="max-w-full h-auto rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(message.imageUrl, "_blank")}
                                  />
                                </div>
                              )}
                              {message.text && (
                                <div>{message.text}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </CardContent>

              <div className="border-t p-4 space-y-2">
                {selectedImage && (
                  <div className="relative inline-block">
                    <img
                      src={selectedImage}
                      alt="Preview"
                      className="max-w-[200px] max-h-[200px] rounded-md object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={handleRemoveImage}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0"
                    type="button"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Textarea
                    ref={textareaRef}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nachricht schreiben..."
                    className="min-h-[60px] resize-none flex-1"
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!messageText.trim() && !selectedImage}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Senden
                </Button>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

