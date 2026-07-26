"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

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

// ---- Icons ----
function IconDiamond({ className = "", width = 18, height = 18 }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
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
function IconFile({ className = "", width = 16, height = 16 }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
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
function IconUpload({ className = "", width = 16, height = 16 }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function IconClip({ className = "", width = 20, height = 20 }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
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

const ICON_BTN =
  "flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed";
const PANEL_BTN =
  "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-gray-200/60 bg-white/50 backdrop-blur-sm text-gray-700 text-[13px] font-medium transition-all duration-200 hover:bg-white hover:shadow-[0_2px_10px_rgba(0,0,0,0.04)] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";

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
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [welcomeText, setWelcomeText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast>({ show: false, message: "", type: "success" });
  const [sources, setSources] = useState<Source[]>([]);
  const [greeting] = useState(getGreeting);

  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isConnecting]);

  useEffect(() => {
    document.body.style.overflow = (isSidebarOpen || showWelcomeModal) ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen, showWelcomeModal]);

  useEffect(() => {
    if (messages.length > 0) return;
    const fullText = "What do you want to explore today?";
    let i = 0;
    setWelcomeText("");
    const interval = setInterval(() => {
      i++;
      setWelcomeText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, 45);
    return () => clearInterval(interval);
  }, [messages.length]);

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
    toastTimerRef.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}/api/upload`, true);

    // Track the upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setSources((prev) => [...prev, { name: file.name, size: formatFileSize(file.size) }]);
        showToast(`Indexed ${file.name}`, "success");
        setShowWelcomeModal(false); // Close modal on success
      } else {
        showToast("Upload failed.", "error");
      }
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    xhr.onerror = () => {
      showToast("Upload failed due to a network error.", "error");
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    xhr.send(formData);
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
      setSources(previous); 
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
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#FCFCFD] text-gray-900 relative antialiased selection:bg-red-200 selection:text-red-900">
      
      {/* ---------------- WELCOME & UPLOAD MODAL ---------------- */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_24px_80px_rgba(220,38,38,0.2)] p-8 sm:p-12 relative overflow-hidden animate-in zoom-in-95 duration-400 border border-red-50">
            
            {/* Close 'X' Button */}
            {!isUploading && (
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full flex items-center justify-center transition-colors z-20"
                aria-label="Close modal"
              >
                <IconClose />
              </button>
            )}

            {/* Decorative background blur inside the modal */}
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-red-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-red-400/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-6">
                  {/* Pulsing Upload Animation with Progress % */}
                  <div className="relative w-28 h-28 flex items-center justify-center mb-8">
                    <div className="absolute inset-0 rounded-full border-[6px] border-red-50 opacity-50" />
                    <div className="absolute inset-0 rounded-full border-[6px] border-[#FF3366] border-t-transparent animate-spin" />
                    <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse" />
                    
                    <span className="text-[22px] font-bold text-[#FF3366] animate-pulse">
                      {uploadProgress}%
                    </span>
                  </div>
                  <h2 className="text-[24px] font-bold text-gray-900 mb-3 tracking-tight">Extracting Intelligence</h2>
                  <p className="text-[15px] text-gray-500 max-w-[280px] leading-relaxed">
                    {uploadProgress === 100 
                      ? "Processing your document..." 
                      : "Uploading your document to the workspace..."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Default State */}
                  <div className="w-24 h-24 bg-gradient-to-br from-red-50 to-red-100/50 rounded-[28px] flex items-center justify-center mb-6 shadow-inner ring-1 ring-red-100">
                    <IconUpload width={40} height={40} className="text-[#FF3366]" />
                  </div>
                  <h2 className="text-[28px] sm:text-[32px] font-brand font-bold text-gray-900 mb-4 tracking-tight">Welcome to ScholarAI</h2>
                  <p className="text-[15px] sm:text-[16px] text-gray-500 mb-10 leading-relaxed px-2">
                    Upload your first PDF document to start chatting, extracting insights, and learning faster.
                  </p>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-[#FF3366] to-[#CC0000] text-white text-[16px] sm:text-[17px] font-bold shadow-[0_8px_24px_rgba(220,38,38,0.25)] hover:shadow-[0_12px_32px_rgba(220,38,38,0.35)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    <IconClip width={22} height={22} /> Choose a Document
                  </button>

                  <button 
                    onClick={() => setShowWelcomeModal(false)}
                    className="mt-6 text-[14.5px] font-semibold text-gray-400 hover:text-gray-700 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Skip for now, I just want to chat
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* -------------------------------------------------------- */}


      {/* Dynamic Background Pattern for depth */}
      <div className="absolute inset-0 z-0 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(220, 38, 38, 0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} 
      />

      {/* Toast Notification */}
      {toast.show && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-8 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-6 py-4 max-w-[90vw] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white/90 backdrop-blur-md border border-gray-100 animate-in fade-in slide-in-from-top-6 duration-400"
          style={{
            color:
              toast.type === "success"
                ? "#059669"
                : toast.type === "info"
                ? "#2563eb"
                : "#dc2626",
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse bg-current shadow-[0_0_8px_currentColor]" />
          <span className="text-[14px] font-medium tracking-wide truncate text-gray-800">{toast.message}</span>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-gray-900/20 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed md:relative top-0 left-0 h-full z-50 w-[85%] max-w-[320px] md:max-w-none md:w-[320px] flex flex-col shrink-0 px-6 py-8 bg-[#F8F9FA]/90 backdrop-blur-xl border-r border-gray-200/60 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between mb-10 pl-1">
          <div className="flex items-center gap-3.5 tracking-tight select-none">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-[0_4px_12px_rgba(220,38,38,0.25)] ring-1 ring-red-500/20"
              style={{ background: "linear-gradient(135deg, #FF3366 0%, #CC0000 100%)" }}
            >
              <IconDiamond className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-brand text-[16px] font-bold tracking-wide text-gray-900">SCHOLAR AI</span>
              <span className="text-[11px] font-medium text-gray-400 tracking-wider uppercase mt-0.5">Limitless</span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
            className={`${ICON_BTN} md:hidden w-8 h-8 bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-gray-800 hover:bg-gray-50`}
          >
            <IconClose />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="mb-8">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white text-[14px] font-semibold tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-[0_8px_20px_rgba(220,38,38,0.25)] hover:shadow-[0_12px_24px_rgba(220,38,38,0.35)]"
            style={{ background: "linear-gradient(135deg, #FF3366 0%, #CC0000 100%)" }}
          >
            <IconPlus />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-8 -mx-2 px-2">
          {/* Knowledge Base */}
          <div>
            <button
              onClick={() => setIsDropdownOpen((v) => !v)}
              aria-expanded={isDropdownOpen}
              className="flex items-center justify-between w-full py-1.5 select-none bg-transparent border-none cursor-pointer group"
            >
              <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-400 group-hover:text-gray-600 transition-colors">Knowledge Base</span>
              <IconChevronDown
                className={`text-gray-300 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : "rotate-0"} group-hover:text-gray-500`}
              />
            </button>

            {isDropdownOpen && (
              <div className="mt-3 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                {sources.length === 0 ? (
                  <p className="text-[13px] py-2 px-2 m-0 text-gray-400 italic">No documents uploaded.</p>
                ) : (
                  sources.map((source) => (
                    <div
                      key={source.name}
                      className="relative group flex items-center gap-3.5 py-3 px-3.5 rounded-2xl cursor-pointer hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-transparent hover:border-gray-200/50 transition-all duration-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <IconFile className="text-red-500 w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <p className="truncate text-[13.5px] font-medium m-0 text-gray-800">{source.name}</p>
                        <p className="truncate text-[11px] mt-0.5 m-0 text-gray-400">{source.size}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSource(source.name);
                        }}
                        aria-label={`Remove ${source.name}`}
                        className="absolute right-3.5 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 active:scale-95 bg-white shadow-sm border border-gray-100 text-red-500 hover:text-red-600 cursor-pointer"
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
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase mb-3.5 m-0 select-none text-gray-400 pl-1">Chat History</p>
            <div className="space-y-1.5">
              {DEMO_CHAT_HISTORY.map((chat) => {
                const active = activeChatId === chat.id;
                return (
                  <button
                    key={chat.id}
                    onClick={() => handleLoadHistory(chat.id, chat.title)}
                    className={`w-full flex items-start gap-3.5 py-3.5 px-3.5 text-left rounded-2xl transition-all duration-200 border cursor-pointer ${
                      active ? "bg-white border-gray-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]" : "bg-transparent border-transparent hover:bg-white/50 hover:border-gray-200/30"
                    }`}
                  >
                    <IconMessage className={`shrink-0 mt-0.5 ${active ? "text-red-500" : "text-gray-300"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`truncate text-[13.5px] font-medium m-0 ${active ? "text-gray-900" : "text-gray-600"}`}>
                        {chat.title}
                      </p>
                      <p className={`text-[11px] mt-1 m-0 ${active ? "text-red-400/80" : "text-gray-400"}`}>{chat.date}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="mt-6 pt-6 hidden md:block relative z-10">
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className={PANEL_BTN}>
            {isUploading ? (
              <span className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
            ) : (
              <IconUpload className="text-gray-500 group-hover:text-red-500 transition-colors" />
            )}
            <span className="text-gray-700">Upload Document</span>
          </button>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        
        {/* Glassmorphic Header */}
        <header className="h-[76px] flex items-center justify-between px-6 sm:px-10 shrink-0 z-30 sticky top-0 bg-white/70 backdrop-blur-xl border-b border-gray-200/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
              className={`${ICON_BTN} md:hidden w-10 h-10 bg-white shadow-sm border border-gray-100 text-gray-600`}
            >
              <IconMenu />
            </button>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-[0_2px_8px_rgba(220,38,38,0.2)]"
                style={{ background: "linear-gradient(135deg, #FF3366 0%, #CC0000 100%)" }}
              >
                <IconDiamond className="w-4 h-4" />
              </div>
              <span className="text-[14.5px] font-medium text-gray-800 hidden sm:inline tracking-tight">{greeting}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              title="Back to Home"
              aria-label="Back to home"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm text-gray-400 hover:text-red-600 hover:border-red-100 hover:shadow-[0_2px_8px_rgba(220,38,38,0.1)] transition-all duration-300"
            >
              <IconHome />
            </Link>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-10 custom-scrollbar flex flex-col pt-8 pb-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-1000 max-w-2xl mx-auto w-full px-4 text-center pb-20">
              <div className="w-20 h-20 mb-8 rounded-3xl flex items-center justify-center shadow-[0_8px_32px_rgba(220,38,38,0.15)] ring-1 ring-red-500/10 bg-gradient-to-br from-white to-red-50">
                <IconDiamond className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="font-brand text-4xl sm:text-5xl font-bold mb-4 tracking-tight min-h-[1.2em] text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-red-800 to-red-600">
                {welcomeText}
              </h1>
              <p className="text-[17px] mt-2 font-medium text-gray-500 max-w-md leading-relaxed">
                Upload a document from the sidebar to begin analyzing, or just start typing to explore.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-4xl mx-auto py-4 space-y-10">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex w-full animate-in fade-in slide-in-from-bottom-3 duration-400 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div
                      className="px-6 py-4 whitespace-pre-wrap break-words text-[15.5px] leading-relaxed max-w-[85%] sm:max-w-[75%] rounded-[24px] rounded-br-sm font-normal text-white shadow-[0_8px_24px_rgba(220,38,38,0.25)] ring-1 ring-white/20"
                      style={{ background: "linear-gradient(135deg, #FF3366 0%, #CC0000 100%)" }}
                    >
                      {msg.content}
                    </div>
                  ) : (
                    <div className="flex gap-4 max-w-[95%] sm:max-w-[85%]">
                      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-red-50 to-white border border-red-100 shadow-sm mt-1">
                        <IconDiamond className="w-4 h-4 text-red-500" />
                      </div>
                      <div
                        className="px-6 py-5 whitespace-pre-wrap break-words text-[15.5px] leading-relaxed rounded-[24px] rounded-tl-sm font-normal bg-white text-gray-800 border border-gray-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                      >
                        {msg.content ? (
                          msg.content
                        ) : isConnecting && idx === messages.length - 1 ? (
                          <div className="flex items-center gap-3 h-6 text-gray-400">
                            <span className="w-4 h-4 rounded-full animate-spin border-2 border-gray-200 border-t-red-500" />
                            <span className="animate-pulse text-[14.5px]">Thinking...</span>
                          </div>
                        ) : isTyping && idx === messages.length - 1 ? (
                          <div className="flex items-center gap-1.5 h-6">
                            <span className="w-2 h-2 rounded-full animate-bounce bg-red-400 [animation-delay:0ms]" />
                            <span className="w-2 h-2 rounded-full animate-bounce bg-red-400 [animation-delay:150ms]" />
                            <span className="w-2 h-2 rounded-full animate-bounce bg-red-400 [animation-delay:300ms]" />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} className="h-6" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="w-full px-4 sm:px-10 pb-8 pt-6 shrink-0 z-20 relative">
          
          {/* Gradient fade overlay for smooth scrolling effect */}
          <div className="absolute top-0 left-0 w-full h-12 -mt-12 bg-gradient-to-t from-[#FCFCFD] to-transparent pointer-events-none" />

          <div className="max-w-4xl mx-auto relative group">
            <div
              className="flex items-end gap-3 rounded-[32px] p-2 bg-white/80 backdrop-blur-xl border border-gray-200/80 transition-all duration-300 focus-within:border-red-300 focus-within:ring-4 focus-within:ring-red-500/10 focus-within:bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
            >
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Upload PDF"
                aria-label="Upload PDF"
                className={`${ICON_BTN} mb-1 ml-1 w-11 h-11 shrink-0 rounded-full bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent transition-colors`}
              >
                {isUploading ? (
                  <span className="w-4.5 h-4.5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                ) : (
                  <IconClip width={20} height={20} />
                )}
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                onCompositionStart={() => (isComposingRef.current = true)}
                onCompositionEnd={() => (isComposingRef.current = false)}
                placeholder="Message ScholarAI..."
                aria-label="Message ScholarAI"
                className="flex-1 resize-none custom-scrollbar text-[15.5px] py-3.5 min-h-[50px] max-h-[200px] font-medium outline-none bg-transparent border-none text-gray-800 placeholder:text-gray-400 leading-relaxed"
                rows={1}
              />

              <button
                onClick={sendMessage}
                disabled={!canSend}
                title="Send message"
                aria-label="Send message"
                className={`mb-1 mr-1 w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed border-none shadow-sm ${
                  canSend 
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white cursor-pointer hover:shadow-[0_4px_16px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95" 
                    : "bg-gray-100 text-gray-300"
                }`}
              >
                <IconSend className={canSend ? "translate-x-[1px]" : ""} />
              </button>
            </div>

            <div className="text-center mt-4 select-none">
              <span className="text-[12.5px] font-medium text-gray-400">
                Scholar AI is an advanced model and may occasionally make mistakes. Verification is recommended.
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