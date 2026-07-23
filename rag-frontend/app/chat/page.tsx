"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const API = "https://scholarai-tswp.onrender.com";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Restored Features State
  const [welcomeText, setWelcomeText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: "", type: 'success' });
  
  const [sources, setSources] = useState<{ name: string; size: string }[]>([
    { name: "Machine learning.pdf", size: "Pre-loaded Database" },
    { name: "API Documentation.pdf", size: "1.2 MB" }
  ]);
  
  const [chatHistory] = useState([
    { id: 1, title: "Understanding Machine Learning", date: "Today" },
    { id: 2, title: "Data processing pipelines", date: "Yesterday" },
    { id: 3, title: "Model deployment strategies", date: "Previous 7 Days" },
    { id: 4, title: "Explain quantum computing", date: "Previous 30 Days" }
  ]);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mobile sidebar body lock
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isSidebarOpen]);

  // Restored Typing Animation
  useEffect(() => {
    if (messages.length > 0) return;
    
    const fullText = "Start a conversation.";
    let currentIndex = 0;
    setWelcomeText(""); 
    
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setWelcomeText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100); 

    return () => clearInterval(typingInterval);
  }, [messages.length]); 

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: 'success' }), 3000);
  };
  
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
      { role: "user", content: `Can you explain ${title}?` },
      { role: "assistant", content: `This is a simulated history for "${title}".\n\nTo make this real, we will need to connect this to a backend endpoint.` }
    ]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping || isConnecting) return;

    const userMessage = input.trim();
    setInput("");
    
    if (messages.length === 0) setActiveChatId(null);

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsConnecting(true);
    setIsTyping(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      console.log("Sending request to:", `${API}/api/chat`);
      const formData = new FormData();
      formData.append("query", userMessage);

      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", res.status, res.statusText);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
      }

      if (!res.body) throw new Error("No response body");

      setIsConnecting(false);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        console.log("Received chunk:", chunk);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated.length - 1;
          updated[last] = { ...updated[last], content: updated[last].content + chunk };
          return updated;
        });
      }
    } catch (error) {
      console.error("Send message error:", error);
      setIsTyping(false);
      setIsConnecting(false);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated.length - 1;
        updated[last] = { 
          role: "assistant", 
          content: `Error: ${error instanceof Error ? error.message : "Connection interrupted. Please try again."}` 
        };
        return updated;
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await fetch(`${API}/api/upload`, {
        method: "POST",
        body: formData,
      });
      
      const fileSize = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;

      setSources((prev) => [...prev, { name: file.name, size: fileSize }]);
      showToast(`Indexed ${file.name}`, 'success');
      
    } catch {
      showToast("Upload failed.", 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveSource = async (nameToRemove: string) => {
    setSources((prev) => prev.filter(source => source.name !== nameToRemove));
    
    try {
      const formData = new FormData();
      formData.append("filename", nameToRemove);

      await fetch(`${API}/api/delete`, {
        method: "POST",
        body: formData,
      });
      
      showToast(`Deleted ${nameToRemove}`, 'info');
    } catch {
      showToast(`Failed to delete ${nameToRemove} from database`, 'error');
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-bg-base text-text-primary font-[family-name:var(--font-inter)] antialiased overflow-hidden selection:bg-[#6C63FF]/30 selection:text-white relative">
      
      {/* Restored Toast System */}
      {toast.show && (
        <div className={`absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-4 md:px-6 py-3 rounded-full shadow-card backdrop-blur-xl border animate-in fade-in slide-in-from-top-4 duration-300 max-w-[90vw]
          ${toast.type === 'success' ? 'bg-bg-surface/95 border-[#22C55E]/30 text-[#22C55E]' : 
            toast.type === 'info' ? 'bg-bg-surface/95 border-[#38BDF8]/30 text-[#38BDF8]' : 
            'bg-bg-surface/95 border-[#EF4444]/30 text-[#EF4444]'}`}>
          <div className="w-2.5 h-2.5 rounded-full bg-current shrink-0 animate-pulse" />
          <span className="text-[13px] md:text-[14px] font-[500] tracking-wide truncate">{toast.message}</span>
        </div>
      )}

      {/* Restored Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR (Now responsive again) */}
      <aside className={`
        fixed md:relative top-0 left-0 h-full z-50 md:z-10
        w-[85%] max-w-[320px] md:max-w-none md:w-[280px] 
        bg-bg-surface border-r border-border-subtle 
        flex flex-col p-[24px_20px] shrink-0 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        
        {/* Logo & Mobile Close */}
        <div className="flex items-center justify-between mb-[32px]">
          <div className="flex items-center">
          <span className="font-[family-name:var(--font-syne)] text-[20px] font-[600] text-text-primary">Scholar</span>
          <span className="font-[family-name:var(--font-syne)] text-[20px] font-[600] text-accent-primary">AI</span>
        </div>
          
          <div className="flex items-center gap-2">
            <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-bg-elevated text-text-secondary hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
          <button 
            onClick={handleNewChat}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-full bg-bg-elevated text-text-secondary hover:text-white hover:bg-border-subtle transition-all shrink-0"
            title="New Chat"
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-8 -mx-2 px-2">
          
          {/* Restored Document Dropdown */}
          <div className="flex flex-col">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full group py-1"
            >
              <h2 className="font-[family-name:var(--font-mono)] text-[10px] text-text-tertiary group-hover:text-text-secondary tracking-[0.12em] transition-colors">
                KNOWLEDGE BASE
              </h2>
              <svg 
                xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                className={`text-text-tertiary shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="mt-3 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {sources.length === 0 ? (
                  <p className="text-[12px] text-text-tertiary py-2 font-[400]">No documents uploaded.</p>
                ) : (
                  sources.map((source, idx) => (
                    <div key={idx} className="relative group flex items-center gap-3 py-2 px-3 rounded-md hover:bg-bg-elevated transition-colors cursor-pointer">
                      <div className="w-[4px] h-[4px] rounded-full bg-accent-primary shrink-0" />
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="text-[13px] font-[500] text-text-secondary group-hover:text-text-primary truncate">{source.name}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveSource(source.name); }}
                        className="absolute right-2 w-7 h-7 rounded-md bg-border-subtle text-text-secondary hover:bg-[#EF4444] hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Restored Chat History */}
          <div className="flex flex-col">
            <h2 className="font-[family-name:var(--font-mono)] text-[10px] text-text-tertiary tracking-[0.12em] mb-3">
              RECENT CHATS
            </h2>
            
            <div className="space-y-1">
              {chatHistory.map((chat) => (
                <button 
                  key={chat.id} 
                  onClick={() => handleLoadHistory(chat.id, chat.title)}
                  className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-md transition-all text-left group
                    ${activeChatId === chat.id ? 'bg-[#6C63FF]/[0.08] text-accent-primary border border-[#6C63FF]/20' : 'hover:bg-bg-elevated text-text-secondary border border-transparent'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-[500] truncate w-full transition-colors 
                      ${activeChatId === chat.id ? 'text-text-primary' : 'group-hover:text-text-primary'}`}>
                      {chat.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Upload Button (per ScholarAI spec) */}
        <div className="mt-6 pt-6 border-t border-border-subtle hidden md:block">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-[10px] bg-[#6C63FF]/[0.08] border border-[#6C63FF]/20 rounded-md p-[12px_16px] text-[13px] font-[500] text-text-secondary transition-all hover:bg-[#6C63FF]/[0.15] hover:border-[#6C63FF]/40 hover:text-text-primary disabled:opacity-50"
          >
            {isUploading ? (
              <span className="w-[16px] h-[16px] border-[2px] border-[var(--text-secondary)] border-t-[var(--accent-primary)] rounded-full animate-spin shrink-0" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            )}
            Upload Document
          </button>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col relative bg-bg-base min-w-0">
        
        {/* HEADER (Now Responsive) */}
        <header className="h-[56px] border-b border-border-subtle px-[20px] md:px-[24px] flex items-center justify-between shrink-0 bg-bg-base">
          <div className="flex items-center gap-3 md:gap-2.5">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-sm bg-bg-surface border border-border-subtle text-text-secondary hover:text-white transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
              </svg>
            </button>
            <div className="flex items-center gap-2.5">
              <span className="w-[8px] h-[8px] rounded-full bg-[#22C55E]" />
              <h2 className="text-[14px] font-[500] text-text-primary">AI Assistant</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleNewChat}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-sm bg-accent-primary text-white hover:brightness-110 shrink-0 transition-colors shadow-glow-accent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <Link href="/" className="hidden md:block text-[13px] text-text-tertiary hover:text-text-primary transition-colors">
              Back to Home
            </Link>
          </div>
        </header>

        {/* MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto px-[16px] md:px-[24px] py-[32px] custom-scrollbar">
          {messages.length === 0 ? (
            
            /* Restored & Adapted Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-500 max-w-lg mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary mb-6">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <h1 className="text-[18px] md:text-[22px] font-[600] text-text-primary mb-3 flex items-center justify-center">
                {welcomeText}
                <span className="inline-block w-[3px] h-[22px] ml-1 bg-accent-primary animate-pulse rounded-full opacity-80" />
              </h1>
              <p className="text-[13px] md:text-[14px] text-text-secondary leading-relaxed">
                Upload a PDF from the sidebar, then ask anything about it. Responses stream in real-time.
              </p>
            </div>

          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  
                  {msg.role === "user" ? (
                    <div className="bg-accent-primary text-white text-[14px] font-[400] px-[18px] py-[12px] rounded-[18px_18px_4px_18px] max-w-[85%] md:max-w-[65%] shadow-[0_4px_16px_rgba(108,99,255,0.3)] whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="bg-bg-surface text-text-primary border border-border-subtle text-[14px] font-[400] leading-[1.6] px-[18px] py-[12px] rounded-[18px_18px_18px_4px] max-w-[95%] md:max-w-[70%] whitespace-pre-wrap break-words">
                      {msg.content ? msg.content : (
                        isConnecting && idx === messages.length - 1 ? (
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-[var(--text-tertiary)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
                            <span className="text-text-secondary">Connecting to server...</span>
                          </div>
                        ) : (
                          isTyping && idx === messages.length - 1 && (
                            <div className="flex items-center gap-1.5 h-5">
                              <span className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          )
                        )
                      )}
                    </div>
                  )}

                </div>
              ))}
              <div ref={bottomRef} className="h-4" />
            </div>
          )}
        </div>

        {/* INPUT AREA (Restored Inline Button + ScholarAI Styling) */}
        <div className="p-[16px_20px] md:p-[16px_24px] border-t border-border-subtle bg-bg-base">
          <div className="max-w-[800px] mx-auto">
            <div className="flex items-end gap-[10px] md:gap-[12px] bg-bg-surface border border-border-subtle rounded-xl p-[8px_8px_8px_12px] md:p-[12px_12px_12px_16px] transition-all focus-within:border-[#6C63FF]/50 focus-within:shadow-[0_0_0_3px_rgba(108,99,255,0.1)]">
              
              {/* Restored Inline Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="mb-[2px] w-[36px] h-[36px] flex items-center justify-center rounded-full bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-[#6C63FF]/20 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                title="Attach Document"
              >
                {isUploading ? (
                  <span className="w-[16px] h-[16px] border-[2px] border-[var(--text-secondary)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                )}
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask anything about your document..."
                className="flex-1 max-h-[120px] min-h-[40px] bg-transparent border-none outline-none text-[14px] text-text-primary placeholder:text-text-tertiary py-[10px] resize-none custom-scrollbar"
                rows={1}
              />
              
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="mb-[2px] w-[36px] h-[36px] md:w-[40px] md:h-[40px] flex items-center justify-center rounded-full shrink-0 transition-all duration-200 
                  disabled:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                  bg-accent-primary text-white hover:scale-105 shadow-[0_4px_16px_rgba(108,99,255,0.4)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="translate-y-[-1px] translate-x-[1px]">
                  <path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>
                </svg>
              </button>

            </div>
{/* pinecode adde  */}
          </div>
        </div>
      </main>
      
      {/* Hidden File Input for Mobile/Inline clicks */}
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

    </div>
  );
}