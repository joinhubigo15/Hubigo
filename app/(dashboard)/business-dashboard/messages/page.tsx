"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Search, Send, User, Loader2, Trash2, ChevronLeft } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";
import {
  getDashboardConversations,
  getDashboardConversationMessages,
  replyToDashboardConversation,
  deleteDashboardConversation,
  type DashboardConversation,
  type DashboardMessage,
} from "@/app/lib/business-dashboard-api";

const POLL_INTERVAL_MS = 10_000;

export default function BusinessMessagesPage() {
  const { accessToken } = useAuth();
  const [conversations, setConversations] = useState<DashboardConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    const load = () =>
      getDashboardConversations(accessToken)
        .then((convos) => {
          setConversations(convos);
          setActiveId((prev) => prev ?? convos[0]?.id ?? null);
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
      getDashboardConversationMessages(accessToken, activeId)
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
    const message = await replyToDashboardConversation(accessToken, activeId, text);
    setMessages((prev) => [...prev, message]);
  };

  const deleteConversation = async (id: string) => {
    if (!accessToken || !confirm("Delete this conversation? This can't be undone.")) return;
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
    await deleteDashboardConversation(accessToken, id).catch(() => {});
  };

  const filteredConversations = conversations.filter((c) => c.customerName.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col font-sans flex-1 min-h-[calc(100vh-64px)] bg-white w-full">
      {/* Header Bar */}
      <div className="hidden lg:block bg-white rounded-none border-b border-slate-200/90 p-5 shadow-none shadow-slate-200/50 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-none flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-indigo-600" />
            Customer Inbox
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Customer Messages</h1>
        <p className="text-xs text-slate-500 font-semibold">Directly communicate with customers who message your listing.</p>
      </div>

      {/* Main Inbox Interface Grid */}
      <div className="bg-white rounded-none border-b border-slate-200/90 shadow-none shadow-slate-200/50 grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-56px)] lg:h-[550px] overflow-hidden  relative z-10">
        {/* Left Column: Conversation Sidebar */}
        <div className={cn("lg:col-span-4 border-r border-slate-200/90 flex flex-col divide-y divide-slate-100 overflow-y-auto h-full", activeId ? "hidden lg:flex" : "flex")}>
          <div className="lg:hidden px-4 pt-5 pb-3 border-b border-slate-100 bg-white shrink-0">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Customer Inbox</h2>
          </div>
          <div className="p-3.5 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold p-4 text-center">No conversations yet.</p>
            ) : (
              filteredConversations.map((chat) => {
                const isSelected = activeId === chat.id;
                const unread = chat.messages.filter((m) => m.sender === "CUSTOMER" && !m.isRead).length;
                return (
                  <button
                    key={chat.id}
                    onClick={() => setActiveId(chat.id)}
                    className={cn(
                      "w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer",
                      isSelected ? "bg-purple-50/70 border-l-4 border-purple-600" : "hover:bg-slate-50",
                    )}
                  >
                    <div className="relative shrink-0 w-10 h-10 rounded-full bg-purple-100 border border-slate-200 flex items-center justify-center text-purple-500">
                      <User className="w-5 h-5" />
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-black flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate">{chat.customerName}</h4>
                        <span className="text-[9px] text-slate-400 font-semibold">{new Date(chat.lastMessageAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{chat.messages[0]?.body ?? "No messages yet"}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div className={cn("lg:col-span-8 flex flex-col justify-between bg-[#f8fafc]/50 h-full overflow-hidden", activeId ? "flex" : "hidden lg:flex")}>
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-semibold">Select a conversation</div>
          ) : (
            <>
              <div className="p-3.5 bg-white border-b border-slate-200/90 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => setActiveId(null)}
                    className="lg:hidden p-1.5 -ml-1 rounded-none text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">{activeChat.customerName}</h4>
                    {activeChat.customerPhone && <p className="text-[10px] text-slate-400 font-semibold">{activeChat.customerPhone}</p>}
                  </div>
                </div>
                <button
                  onClick={() => deleteConversation(activeChat.id)}
                  className="p-2 rounded-none text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                  title="Delete conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex flex-col max-w-sm space-y-1", msg.sender === "BUSINESS" ? "ml-auto items-end" : "items-start")}>
                    <div
                      className={cn(
                        "p-3 rounded-none text-xs font-medium shadow-none leading-relaxed",
                        msg.sender === "BUSINESS" ? "bg-purple-600 text-white rounded-br-xs" : "bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs",
                      )}
                    >
                      {msg.body}
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold px-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-white border-t border-slate-200/90 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                />
                <button
                  onClick={sendMessage}
                  className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-none shadow-none shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
