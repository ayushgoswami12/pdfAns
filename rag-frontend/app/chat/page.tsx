// FILE: app/chat/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar, { HistoryItem } from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { IconDiamond, IconPlus, IconMic, IconSend } from "@/components/icons";
import { ACCENT_GRADIENT } from "@/lib/theme";
import {
  listSessions,
  createSession,
  getSessionMessages,
  streamChat,
  listSources,
  uploadFile,
  SessionRow,
} from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const scopedFile = searchParams.get("file");

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [sessionTitle, setSessionTitle] = useState("New Chat");
  const [sourcesTotal, setSourcesTotal] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    document.title = "Chat · ScholarAI";
  }, []);

  const refreshSessions = useCallback(async () => {
    try {
      setSessions(await listSessions());
    } catch {
      // Sidebar just shows an empty history list if this fails — not fatal.
    }
  }, []);

  const LAST_SESSION_KEY = "scholarai:lastSessionId";

  useEffect(() => {
    refreshSessions();
    listSources()
      .then((rows) => setSourcesTotal(rows.length))
      .catch(() => {});

    // Chat's local state is wiped every time this route unmounts (e.g.
    // navigating to /library and back) — the messages are still safe in
    // SQLite, this just restores which conversation was open so it
    // doesn't come back blank. Skipped when arriving via a Library
    // "Ask AI" deep-link, since that should start a fresh conversation.
    if (!scopedFile) {
      const savedId = typeof window !== "undefined" ? localStorage.getItem(LAST_SESSION_KEY) : null;
      if (savedId) loadSession(Number(savedId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSessions]);

  // Arriving from Library's "Ask AI" button: start a fresh chat with the
  // filename pre-filled so the backend's existing filename-in-query
  // detection (get_filter_for_query in main.py) scopes retrieval to it.
  useEffect(() => {
    if (scopedFile) {
      setInput(`Regarding ${scopedFile}, `);
      textareaRef.current?.focus();
    }
  }, [scopedFile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  const handleNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    setSessionTitle("New Chat");
    setInput("");
    setIsSidebarOpen(false);
    if (typeof window !== "undefined") localStorage.removeItem(LAST_SESSION_KEY);
  };

  const loadSession = async (sessionId: number) => {
    setActiveSessionId(sessionId);
    if (typeof window !== "undefined") localStorage.setItem(LAST_SESSION_KEY, String(sessionId));
    try {
      const rows = await getSessionMessages(sessionId);
      setMessages(rows.map((r) => ({ role: r.role, content: r.content })));
    } catch {
      setMessages([{ role: "assistant", content: "⚠️ Couldn't load this conversation's history." }]);
    }
  };

  const handleSelectHistory = async (id: string | number) => {
    setIsSidebarOpen(false);
    await loadSession(Number(id));
  };

  // Session titles come from the sessions list, which may still be
  // loading when a session is restored on mount — sync the title in
  // once both are available instead of hardcoding it at load time.
  useEffect(() => {
    if (activeSessionId === null) return;
    const session = sessions.find((s) => s.id === activeSessionId);
    if (session) setSessionTitle(session.title);
  }, [sessions, activeSessionId]);

  const sendMessage = async () => {
    const userMessage = input.trim();
    if (!userMessage || isTyping) return;

    let sessionId = activeSessionId;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      // Lazily create the session on the first message, titled from it —
      // matches the "starts empty, fills in as you go" behavior.
      if (sessionId === null) {
        const title = userMessage.length > 40 ? `${userMessage.slice(0, 40)}…` : userMessage;
        const created = await createSession(title);
        sessionId = created.id;
        setActiveSessionId(sessionId);
        setSessionTitle(title);
        setSessions((prev) => [created, ...prev]);
        if (typeof window !== "undefined") localStorage.setItem(LAST_SESSION_KEY, String(sessionId));
      }

      await streamChat(userMessage, sessionId, (chunk) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated.length - 1;
          updated[last] = { ...updated[last], content: updated[last].content + chunk };
          return updated;
        });
      });
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated.length - 1;
        updated[last] = {
          role: "assistant",
          content: `⚠️ ${error instanceof Error ? error.message : "Connection interrupted."}`,
        };
        return updated;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      await Promise.all(Array.from(files).map((f) => uploadFile(f)));
      const rows = await listSources();
      setSourcesTotal(rows.length);
    } catch {
      // A failed upload here doesn't need to interrupt the chat — the
      // Sources page is the place to see/retry failures in detail.
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault();
      sendMessage();
    }
  };

  const canSend = input.trim().length > 0 && !isTyping;
  const historyItems: HistoryItem[] = sessions.map((s) => ({ id: s.id, title: s.title }));

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-white text-gray-900 relative antialiased selection:bg-violet-200 selection:text-violet-900">
      <Sidebar
        active="new-chat"
        showRecentHistory
        historyItems={historyItems}
        activeHistoryId={activeSessionId}
        onSelectHistory={handleSelectHistory}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <TopBar
          mode="session"
          activeTab="history"
          sessionTitle={sessionTitle}
          sourcesActiveCount={sourcesTotal}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 custom-scrollbar flex flex-col pt-6 pb-4">
          {isUploading && (
            <div className="sticky top-0 z-10 w-full flex justify-center mb-6">
              <div className="bg-white/90 backdrop-blur border border-gray-200 shadow-sm rounded-full px-5 py-2 flex items-center gap-3">
                <span className="w-3.5 h-3.5 border-[2.5px] border-gray-300 border-t-violet-500 rounded-full animate-spin" />
                <span className="text-[13px] text-gray-700 font-medium">Uploading & indexing…</span>
              </div>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4 text-center pb-16">
              <div className="w-20 h-20 mb-8 rounded-3xl flex items-center justify-center shadow-[0_8px_32px_rgba(124,92,252,0.15)] ring-1 ring-violet-500/20 bg-gradient-to-br from-gray-50 to-gray-100">
                <IconDiamond className="w-10 h-10 text-violet-500" />
              </div>
              <h1 className="font-brand text-4xl sm:text-5xl font-bold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-violet-500 to-violet-700">
                What do you want to explore today?
              </h1>
              <p className="text-[17px] mt-2 font-medium text-gray-500 max-w-md leading-relaxed">
                {sourcesTotal > 0
                  ? `${sourcesTotal} source${sourcesTotal === 1 ? "" : "s"} available — ask anything, or mention a filename to focus on one.`
                  : "Upload a document from Sources to begin analyzing, or just start typing to explore."}
              </p>
            </div>
          ) : (
            <div className="w-full max-w-3xl mx-auto py-2 space-y-8">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "user" ? (
                    <div className="px-5 py-3.5 whitespace-pre-wrap break-words text-[14.5px] leading-relaxed max-w-[85%] sm:max-w-[75%] rounded-[20px] rounded-br-sm bg-gray-100 text-gray-900 border border-gray-300/60">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="flex gap-3.5 max-w-[95%] sm:max-w-[88%]">
                      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white mt-0.5" style={{ background: ACCENT_GRADIENT }}>
                        <IconDiamond className="w-4 h-4" />
                      </div>
                      <div className="px-5 py-5 rounded-[20px] rounded-tl-sm bg-gray-50 border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.25)] min-w-0 flex-1">
                        {msg.content ? (
                          <p className="text-[14.5px] leading-relaxed text-gray-900 m-0 whitespace-pre-wrap break-words">{msg.content}</p>
                        ) : isTyping && idx === messages.length - 1 ? (
                          <div className="flex items-center gap-1.5 h-6">
                            <span className="w-2 h-2 rounded-full animate-bounce bg-violet-500 [animation-delay:0ms]" />
                            <span className="w-2 h-2 rounded-full animate-bounce bg-violet-500 [animation-delay:150ms]" />
                            <span className="w-2 h-2 rounded-full animate-bounce bg-violet-500 [animation-delay:300ms]" />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} className="h-4" />
            </div>
          )}
        </div>

        <div className="w-full px-4 sm:px-8 pb-6 pt-4 shrink-0 relative">
          <div className="absolute top-0 left-0 w-full h-12 -mt-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          <div className="max-w-3xl mx-auto relative">
            <div className="flex items-end gap-2 rounded-[28px] p-2 bg-white/80 backdrop-blur-xl border border-gray-200 focus-within:border-violet-500/50 focus-within:ring-4 focus-within:ring-violet-500/10 transition-all">
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload a source"
                className="mb-0.5 ml-0.5 w-10 h-10 shrink-0 rounded-full bg-gray-100 text-gray-500 hover:text-violet-600 hover:bg-violet-500/10 flex items-center justify-center transition-colors"
              >
                <IconPlus width={18} height={18} className={isUploading ? "animate-pulse text-violet-500" : ""} />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                onCompositionStart={() => (isComposingRef.current = true)}
                onCompositionEnd={() => (isComposingRef.current = false)}
                placeholder="Ask ScholarAI or upload sources..."
                className="flex-1 resize-none custom-scrollbar text-[14.5px] py-3 min-h-[44px] max-h-[200px] font-medium outline-none bg-transparent border-none text-gray-900 placeholder:text-gray-500 leading-relaxed"
                rows={1}
              />

              <button title="Voice input (not wired up yet)" disabled className="mb-0.5 w-10 h-10 shrink-0 rounded-full text-gray-400 flex items-center justify-center cursor-not-allowed">
                <IconMic />
              </button>

              <button
                onClick={sendMessage}
                disabled={!canSend}
                className={`mb-0.5 mr-0.5 w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  canSend ? "text-white hover:scale-105 active:scale-95" : "bg-gray-100 text-gray-400"
                }`}
                style={canSend ? { background: ACCENT_GRADIENT } : undefined}
              >
                <IconSend className={canSend ? "translate-x-[1px]" : ""} />
              </button>
            </div>
            <div className="flex items-center justify-center mt-3">
              <span className="text-[11.5px] font-medium text-gray-400">
                ScholarAI can make mistakes. Verify important info.
              </span>
            </div>
          </div>
        </div>
      </main>

      <input type="file" multiple accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
    </div>
  );
}

// useSearchParams needs a Suspense boundary in the App Router.
export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}