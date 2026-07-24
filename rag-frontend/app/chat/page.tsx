"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

// Falls back to the deployed backend if the env var isn't set, so this still
// works out of the box — but set NEXT_PUBLIC_API_URL in .env.local / your
// hosting provider for real deployments instead of relying on the fallback.
const API = process.env.NEXT_PUBLIC_API_URL ?? "https://scholarai-tswp.onrender.com";

type Role = "user" | "assistant";
interface ChatMessage {
  role: Role;
  content: string;
}
interface Source {
  name: string;
  size: string;
}
interface ChatHistoryItem {
  id: number;
  title: string;
  date: string;
}
interface Toast {
  show: boolean;
  message: string;
  type: "success" | "error" | "info";
}

// ---- Icons (single source of truth so every usage stays visually consistent) ----
function IconDiamond({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 12L12 2l10 10-10 10Z" />
    </svg>
  );
}
function IconClose({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
function IconPlus({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function IconFile({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function IconTrash({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
function IconMessage({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconUpload({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function IconClip({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
function IconSend({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
function IconMenu({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}
function IconHome({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up?";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatFileSize(bytes: number): string {
  return bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;
}

// Shared class strings so repeated combos (icon buttons, panel buttons, etc.)
// can't silently drift out of alignment with each other.
const ICON_BTN =
  "flex items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
const PANEL_BTN =
  "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] text-[var(--text-secondary)] text-[13px] font-medium transition-colors hover:bg-[var(--bg-panel-hover)] disabled:opacity-50 disabled:cursor-not-allowed";

// NOTE: chat history is placeholder/demo data — the backend has no
// conversation-persistence endpoint yet. Wire this up to a real
// GET /api/chats (and load its messages on click) before shipping;
// until then this only simulates a click for UI-review purposes.
const DEMO_CHAT_HISTORY: ChatHistoryItem[] = [
  { id: 1, title: "Understanding Machine Learning", date: "Today" },
  { id: 2, title: "Data processing pipelines", date: "Yesterday" },
  { id: 3, title: "Model deployment strategies", date: "Previous 7 Days" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [welcomeText, setWelcomeText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast>({ show: false, message: "", type: "success" });
  const [sources, setSources] = useState<Source[]>([]);
  const [greeting] = useState(getGreeting);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isConnecting]);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen]);

  // Typewriter intro on the empty state only.
  useEffect(() => {
    if (messages.length > 0) return;
    const fullText = "What do you want to explore today?";
    let i = 0;
    setWelcomeText("");
    const interval = setInterval(() => {
      i++;
      setWelcomeText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Auto-grow the composer as the user types, capped by max-h in the className.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, message, type });
    toastTimerRef.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  }, []);

  const handleNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
    setInput("");
    setIsSidebarOpen(false);
  };

  const handleLoadHistory = (chatId: number, title: string) => {
    setActiveChatId(chatId);
    setIsSidebarOpen(false);
    // Placeholder content — see DEMO_CHAT_HISTORY note above.
    setMessages([
      { role: "user", content: `Explain ${title}` },
      { role: "assistant", content: `This is placeholder history for "${title}". Connect this view to a real backend endpoint before shipping.` },
    ]);
  };

  const sendMessage = async () => {
    const userMessage = input.trim();
    if (!userMessage || isTyping || isConnecting) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsConnecting(true);
    setIsTyping(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const formData = new FormData();
      formData.append("query", userMessage);
      const res = await fetch(`${API}/api/chat`, { method: "POST", body: formData });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error ${res.status}: ${errorText}`);
      }
      if (!res.body) throw new Error("No response body");

      setIsConnecting(false);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated.length - 1;
          updated[last] = { ...updated[last], content: updated[last].content + chunk };
          return updated;
        });
      }
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
      setIsConnecting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/api/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      setSources((prev) => [...prev, { name: file.name, size: formatFileSize(file.size) }]);
      showToast(`Indexed ${file.name}`, "success");
    } catch {
      showToast("Upload failed.", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveSource = async (nameToRemove: string) => {
    const previous = sources;
    setSources((prev) => prev.filter((s) => s.name !== nameToRemove));
    try {
      const formData = new FormData();
      formData.append("filename", nameToRemove);
      const res = await fetch(`${API}/api/delete`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      showToast(`Deleted ${nameToRemove}`, "info");
    } catch {
      setSources(previous); // roll back the optimistic update
      showToast(`Failed to delete ${nameToRemove}`, "error");
    }
  };

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault();
      sendMessage();
    }
  };

  const canSend = input.trim().length > 0 && !isTyping && !isConnecting;

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] relative antialiased">
      {/* Toast Notification */}
      {toast.show && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-5 py-3.5 max-w-[90vw] rounded-full shadow-2xl bg-[var(--bg-panel)] border border-white/5 animate-in fade-in slide-in-from-top-4 duration-300"
          style={{
            color:
              toast.type === "success"
                ? "var(--status-success)"
                : toast.type === "info"
                ? "var(--status-info)"
                : "var(--status-error)",
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse bg-current" />
          <span className="text-[14px] font-semibold tracking-wide truncate">{toast.message}</span>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/85 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed md:relative top-0 left-0 h-full z-50 w-[85%] max-w-[320px] md:max-w-none md:w-[300px] flex flex-col shrink-0 px-5 py-6 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between mb-8 pl-2">
          <div className="flex items-center gap-3 tracking-tight select-none">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
              style={{ background: "linear-gradient(135deg, var(--brand-from) 0%, var(--brand-to) 100%)" }}
            >
              <IconDiamond />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-brand text-[15px] font-bold tracking-wide text-white">SCHOLAR AI</span>
              <span className="text-[10px] font-medium text-[var(--text-muted)]">Smart. Powerful. Limitless.</span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
            className={`${ICON_BTN} md:hidden w-8 h-8 bg-transparent text-[var(--text-muted)] hover:text-white`}
          >
            <IconClose />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="mb-8">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-[14px] font-semibold tracking-wide transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "linear-gradient(90deg, var(--accent-purple) 0%, var(--accent-blue) 100%)",
              boxShadow: "0 4px 20px rgba(42,139,242,0.25)",
            }}
          >
            <IconPlus />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 -mx-2 px-2">
          {/* Knowledge Base */}
          <div>
            <button
              onClick={() => setIsDropdownOpen((v) => !v)}
              aria-expanded={isDropdownOpen}
              className="flex items-center justify-between w-full py-1 select-none bg-transparent border-none cursor-pointer"
            >
              <span className="text-[12px] font-semibold tracking-wide text-[var(--text-secondary)]">Knowledge Base</span>
              <IconChevronDown
                className={`text-[var(--text-muted)] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : "rotate-0"}`}
              />
            </button>

            {isDropdownOpen && (
              <div className="mt-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                {sources.length === 0 ? (
                  <p className="text-[13px] py-2 px-2 m-0 text-[var(--text-faint)]">No documents uploaded.</p>
                ) : (
                  sources.map((source) => (
                    <div
                      key={source.name}
                      className="relative group flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <IconFile className="text-[var(--accent-blue)] shrink-0" />
                      <div className="flex-1 min-w-0 pr-8">
                        <p className="truncate text-[13px] font-medium m-0 text-[var(--text-secondary)]">{source.name}</p>
                        <p className="truncate text-[11px] m-0 text-[var(--text-faint)]">{source.size}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSource(source.name);
                        }}
                        aria-label={`Remove ${source.name}`}
                        className="absolute right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-95 bg-rose-500/10 text-[var(--status-error)] border-none cursor-pointer"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Recent Chats */}
          <div>
            <p className="text-[12px] font-semibold tracking-wide mb-3 m-0 select-none text-[var(--text-secondary)]">Chat History</p>
            <div className="space-y-1">
              {DEMO_CHAT_HISTORY.map((chat) => {
                const active = activeChatId === chat.id;
                return (
                  <button
                    key={chat.id}
                    onClick={() => handleLoadHistory(chat.id, chat.title)}
                    className={`w-full flex items-start gap-3 py-3 px-3 text-left rounded-xl transition-colors border-none cursor-pointer ${
                      active ? "bg-[var(--bg-hover)]" : "bg-transparent hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <IconMessage className={`shrink-0 mt-0.5 ${active ? "text-[var(--accent-purple)]" : "text-[var(--text-faint)]"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`truncate text-[13px] font-medium m-0 ${active ? "text-white" : "text-[var(--text-tertiary)]"}`}>
                        {chat.title}
                      </p>
                      <p className="text-[11px] mt-1 m-0 text-[var(--text-faint)]">{chat.date}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="mt-6 pt-6 hidden md:block border-t border-[var(--border-subtle)]">
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className={PANEL_BTN}>
            {isUploading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <IconUpload />
            )}
            <span>Upload Document</span>
          </button>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-[var(--bg-app)]">
        {/* Header */}
        <header className="h-[72px] flex items-center justify-between px-6 sm:px-8 shrink-0 z-10 sticky top-0 bg-[var(--bg-app)] border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
              className={`${ICON_BTN} md:hidden w-10 h-10 bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[var(--text-tertiary)]`}
            >
              <IconMenu />
            </button>
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0"
                style={{ background: "linear-gradient(135deg, var(--brand-from) 0%, var(--brand-to) 100%)" }}
              >
                <IconDiamond className="w-3.5 h-3.5" />
              </div>
              <span className="text-[14px] font-medium text-[var(--text-secondary)] hidden sm:inline">{greeting}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              title="Back to Home"
              aria-label="Back to home"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg-panel)] text-[var(--text-tertiary)] hover:text-white transition-colors"
            >
              <IconHome />
            </Link>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 custom-scrollbar flex flex-col pt-6 pb-2">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-start justify-center animate-in fade-in duration-700 max-w-4xl mx-auto w-full px-2 sm:px-4 py-10">
              <h1 className="font-brand text-3xl sm:text-4xl font-semibold mb-3 tracking-tight text-white m-0 min-h-[1.2em]">
                {welcomeText}
              </h1>
              <p className="text-[16px] mt-2 font-medium text-[var(--text-faint)]">
                Upload a PDF from the sidebar to begin analyzing documents.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-4xl mx-auto py-4 space-y-8">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div
                      className="px-6 py-4 whitespace-pre-wrap break-words text-[15px] leading-relaxed max-w-[85%] sm:max-w-[75%] rounded-[18px] rounded-br-sm font-normal text-white"
                      style={{
                        background: "linear-gradient(90deg, #42277E 0%, #2974D6 100%)",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                      }}
                    >
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      className="px-6 py-5 whitespace-pre-wrap break-words text-[15px] leading-relaxed max-w-[95%] sm:max-w-[85%] rounded-[18px] rounded-bl-sm font-normal bg-[var(--bg-panel-hover)] text-[var(--text-secondary)]"
                      style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}
                    >
                      {msg.content ? (
                        msg.content
                      ) : isConnecting && idx === messages.length - 1 ? (
                        <div className="flex items-center gap-3 h-6 text-[var(--text-faint)]">
                          <span
                            className="w-4 h-4 rounded-full animate-spin border-2 border-white/10"
                            style={{ borderTopColor: "var(--accent-purple)" }}
                          />
                          <span className="animate-pulse text-[14px]">Generating response...</span>
                        </div>
                      ) : isTyping && idx === messages.length - 1 ? (
                        <div className="flex items-center gap-1.5 h-6">
                          <span className="w-2 h-2 rounded-full animate-bounce bg-[var(--accent-purple)] [animation-delay:0ms]" />
                          <span className="w-2 h-2 rounded-full animate-bounce bg-[var(--accent-purple)] [animation-delay:150ms]" />
                          <span className="w-2 h-2 rounded-full animate-bounce bg-[var(--accent-purple)] [animation-delay:300ms]" />
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div
          className="w-full px-4 sm:px-8 pb-8 pt-4 shrink-0 z-20"
          style={{ background: "linear-gradient(to top, var(--bg-app) 60%, transparent)" }}
        >
          <div className="max-w-4xl mx-auto relative">
            <div
              className="flex items-end gap-3 rounded-[28px] p-1.5 sm:p-2 border border-[var(--border-input)] bg-[var(--bg-panel)] transition-all duration-300"
              style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}
            >
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Upload PDF"
                aria-label="Upload PDF"
                className={`${ICON_BTN} mb-0.5 w-10 h-10 shrink-0 bg-transparent text-[var(--text-faint)] hover:text-white hover:bg-white/5`}
              >
                {isUploading ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <IconClip />
                )}
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                onCompositionStart={() => (isComposingRef.current = true)}
                onCompositionEnd={() => (isComposingRef.current = false)}
                placeholder="Type your message here..."
                aria-label="Message ScholarAI"
                className="flex-1 resize-none custom-scrollbar text-[15px] py-2.5 min-h-[44px] max-h-[150px] font-normal outline-none mt-0.5 bg-transparent border-none text-white"
                rows={1}
              />

              <button
                onClick={sendMessage}
                disabled={!canSend}
                title="Send message"
                aria-label="Send message"
                className={`mb-0.5 mr-0.5 w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed border-none ${
                  canSend ? "bg-[var(--accent-blue)] text-white cursor-pointer" : "bg-transparent text-[var(--text-faint)]"
                }`}
              >
                <IconSend className={canSend ? "translate-x-[1px]" : ""} />
              </button>
            </div>

            <div className="text-center mt-3 select-none">
              <span className="text-[12px] font-medium text-[var(--text-faint)]">
                Scholar AI can make mistakes. Consider checking important information.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden File Input */}
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
        aria-label="Upload PDF file"
      />
    </div>
  );
}