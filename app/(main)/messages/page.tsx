"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Send, Store, Loader2, Trash2, ChevronLeft } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";
import {
  getMyConversations,
  getMyConversationMessages,
  sendMyConversationReply,
  deleteMyConversation,
  type ConversationSummary,
  type ConversationMessage,
} from "@/app/lib/messages-api";

const POLL_INTERVAL_MS = 10_000;

export default function MyMessagesPage() {
  const { user, accessToken, initializing } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (initializing) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent("/messages")}`);
  }, [initializing, user, router]);

  useEffect(() => {
    if (!accessToken) return;
    const load = () =>
      getMyConversations(accessToken)
        .then((convos) => {
          setConversations(convos);
          setActiveId((prev) => prev ?? (typeof window !== "undefined" && window.innerWidth >= 1024 ? convos[0]?.id : null) ?? null);
        })
        .catch(() => setConversations([]))
        .finally(() => setLoading(false));
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !activeId) return;
    const load = () =>
      getMyConversationMessages(accessToken, activeId)
        .then((res) => setMessages(res.messages))
        .catch(() => setMessages([]));
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [accessToken, activeId]);

  const activeChat = conversations.find((c) => c.id === activeId);

  const sendMessage = async () => {
    if (!inputText.trim() || !accessToken || !activeId) return;
    const text = inputText;
    setInputText("");
    const message = await sendMyConversationReply(accessToken, activeId, text);
    setMessages((prev) => [...prev, message]);
  };

  const deleteConversation = async (id: string) => {
    if (!accessToken || !confirm("Delete this conversation? This can't be undone.")) return;
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
    await deleteMyConversation(accessToken, id).catch(() => {});
  };

  if (initializing || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col font-sans w-full h-[calc(100vh-56px)] lg:h-[calc(100vh-73px)] min-h-0 bg-white border-none">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 p-10 bg-white">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-sm text-slate-700">No conversations yet</h3>
          <p className="text-xs text-slate-500 font-medium">
            Message a business from its listing page and their replies will show up here.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-row bg-white overflow-hidden min-h-0">
          {/* Left Column: Conversation List */}
          <div className={cn(
            "w-full lg:w-[380px] shrink-0 border-r border-slate-200/90 flex flex-col divide-y divide-slate-100 overflow-y-auto h-full",
            activeId ? "hidden lg:flex" : "flex"
          )}>
            {/* Chat list header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Messages</h2>
            </div>

            {conversations.map((chat) => {
              const isSelected = activeId === chat.id;
              const unread = chat.messages.filter((m) => m.sender === "BUSINESS" && !m.isRead).length;
              return (
                <button
                  key={chat.id}
                  onClick={() => setActiveId(chat.id)}
                  className={cn(
                    "w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer",
                    isSelected ? "bg-purple-50/70 border-l-4 border-purple-600" : "hover:bg-slate-50",
                  )}
                >
                  <div className="relative shrink-0 w-10 h-10 rounded-full bg-purple-100 border border-slate-200 overflow-hidden flex items-center justify-center text-purple-500">
                    {chat.business.coverImageUrl || chat.business.logoUrl ? (
                      <img
                        src={chat.business.coverImageUrl ?? chat.business.logoUrl ?? undefined}
                        alt={chat.business.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-5 h-5" />
                    )}
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-black flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">{chat.business.name}</h4>
                      <span className="text-[9px] text-slate-400 font-semibold shrink-0">{new Date(chat.lastMessageAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{chat.messages[0]?.body ?? "No messages yet"}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Chat Window */}
          <div className={cn(
            "flex-1 flex flex-col bg-slate-50/30 h-full overflow-hidden",
            activeId ? "flex" : "hidden lg:flex"
          )}>
            {!activeChat ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
                <span className="text-sm font-semibold">Select a conversation to start chatting</span>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 bg-white border-b border-slate-200/90 flex items-center justify-between gap-3 shrink-0 shadow-sm z-10">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => setActiveId(null)}
                      className="lg:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <Link
                      href={`/business/${activeChat.business.slug}`}
                      className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-9 h-9 rounded-full bg-purple-100 overflow-hidden flex items-center justify-center text-purple-500 shrink-0">
                        {activeChat.business.coverImageUrl || activeChat.business.logoUrl ? (
                          <img
                            src={activeChat.business.coverImageUrl ?? activeChat.business.logoUrl ?? undefined}
                            alt={activeChat.business.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="w-4 h-4" />
                        )}
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">{activeChat.business.name}</h4>
                    </Link>
                  </div>
                  <button
                    onClick={() => deleteConversation(activeChat.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 px-6 lg:px-10 py-6 space-y-3 overflow-y-auto">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex flex-col max-w-[75%] sm:max-w-sm space-y-1", msg.sender === "CUSTOMER" ? "ml-auto items-end" : "items-start")}>
                      <div
                        className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm font-medium shadow-xs leading-relaxed",
                          msg.sender === "CUSTOMER" ? "bg-purple-600 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm",
                        )}
                      >
                        {msg.body}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold px-2">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-white border-t border-slate-200/90 flex items-center gap-3 shrink-0">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm font-semibold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-shadow"
                  />
                  <button
                    onClick={sendMessage}
                    className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-md transition-all cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
