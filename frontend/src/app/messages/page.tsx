"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Send, MessageSquare, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";

function MessagesContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId");
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth"); return; }
    loadConversations();
    
    // Auto-open chat if userId is in URL
    if (initialUserId) {
      fetch(`/api/users/${initialUserId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.id !== user.id) {
            openConversation(data);
          }
        });
    }
  }, [user, authLoading, initialUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversations() {
    const res = await fetch("/api/messages", { credentials: "include" });
    if (res.ok) setConversations(await res.json());
    setLoading(false);
  }

  async function openConversation(otherUser: any) {
    setActiveUser(otherUser);
    setShowSearch(false);
    const res = await fetch(`/api/messages/${otherUser.id}`, { credentials: "include" });
    if (res.ok) setMessages(await res.json());
    // Refresh conversations to update unread
    loadConversations();
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !activeUser) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: activeUser.id, content }),
      credentials: "include",
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setContent("");
      loadConversations();
    }
    setSending(false);
  }

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/messages/search/${encodeURIComponent(searchQuery)}`, { credentials: "include" });
      if (res.ok) setSearchResults(await res.json());
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 h-[calc(100vh-3.5rem)] bg-background">
      {/* Sidebar: Conversations */}
      <div className={`w-full sm:w-80 border-r flex flex-col ${activeUser ? "hidden sm:flex" : "flex"}`}>
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-4 py-2 border rounded-lg bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Find or start a conversation…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
            />
          </div>
          {showSearch && searchResults.length > 0 && (
            <div className="mt-2 bg-background border rounded-lg shadow-lg z-10">
              {searchResults
                .filter((u) => u.id !== user?.id)
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setSearchQuery(""); openConversation(u); }}
                    className="flex items-center gap-3 w-full p-3 hover:bg-muted/50 text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-8 text-center">
              <MessageSquare className="h-10 w-10 opacity-40" />
              <p className="text-sm">No conversations yet. Search for someone to message!</p>
            </div>
          ) : (
            conversations.map(({ user: convUser, latestMessage }) => (
              <button
                key={convUser?.id}
                onClick={() => openConversation(convUser)}
                className={`flex items-center gap-3 w-full p-4 border-b hover:bg-muted/30 text-left transition-colors ${activeUser?.id === convUser?.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  {convUser?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{convUser?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{latestMessage?.content}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">{latestMessage && formatDate(latestMessage.createdAt)}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeUser ? "hidden sm:flex" : "flex"}`}>
        {!activeUser ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <MessageSquare className="h-12 w-12 opacity-30" />
            <p>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="border-b p-4 flex items-center gap-3">
              <button className="sm:hidden mr-1 text-muted-foreground" onClick={() => setActiveUser(null)}>←</button>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {activeUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{activeUser.name}</p>
                {activeUser.email && <p className="text-xs text-muted-foreground">{activeUser.email}</p>}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {formatDate(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="border-t p-4 flex gap-3 items-end">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e as any); } }}
                placeholder={`Message ${activeUser.name}…`}
                rows={1}
                className="flex-1 px-4 py-2.5 border rounded-2xl bg-muted/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32"
              />
              <button
                type="submit"
                disabled={sending || !content.trim()}
                className="p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 shrink-0 transition-colors"
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
          </>
        )}
      </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
