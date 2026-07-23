"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const API = "http://192.168.167.133:8000";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const formData = new FormData();
      formData.append("query", userMessage);

      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        body: formData,
      });

      if (!res.body) throw new Error("No response body");

      setIsTyping(false);
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
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection interrupted. Please try again." },
      ]);
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
      // Optionally handle success state here
    } catch {
      // Optionally handle error state here
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] font-[family-name:var(--font-inter)] antialiased overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-[280px] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] p-[24px_20px] flex flex-col hidden md:flex shrink-0">
        
        {/* Logo */}
        <div className="flex items-center mb-[32px]">
          <span className="font-[family-name:var(--font-syne)] text-[18px] font-[700] text-[var(--text-primary)]">Scholar</span>
          <span className="font-[family-name:var(--font-syne)] text-[18px] font-[700] text-[var(--accent-primary)]">AI</span>
        </div>

        {/* Knowledge Base Section */}
        <div className="flex flex-col flex-1">
          <h2 className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-tertiary)] tracking-[0.12em] mb-[12px]">
            KNOWLEDGE BASE
          </h2>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center gap-[10px] bg-[#6C63FF]/[0.08] border border-[#6C63FF]/20 rounded-[var(--radius-md)] p-[12px_16px] text-[13px] font-[500] text-[var(--text-secondary)] transition-all hover:bg-[#6C63FF]/[0.15] hover:border-[#6C63FF]/40 hover:text-[var(--text-primary)] disabled:opacity-50"
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
          <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
        </div>

        {/* Bottom Sidebar Note */}
        <div className="mt-auto pt-6 border-t border-[var(--border-subtle)]">
          <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
            Answers are generated only from your uploaded documents.
          </p>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col relative bg-[var(--bg-base)] min-w-0">
        
        {/* HEADER */}
        <header className="h-[56px] border-b border-[var(--border-subtle)] px-[24px] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-[8px] h-[8px] rounded-full bg-[#22C55E]" />
            <h2 className="text-[14px] font-[500] text-[var(--text-primary)]">AI Assistant</h2>
          </div>
          
          <Link href="/" className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            Back to Home
          </Link>
        </header>

        {/* MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto px-[24px] py-[32px] custom-scrollbar">
          {messages.length === 0 ? (
            
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-tertiary)] mb-4">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <h1 className="text-[16px] font-[500] text-[var(--text-secondary)] mb-2">Start a conversation</h1>
              <p className="text-[13px] text-[var(--text-tertiary)]">Upload a PDF from the sidebar, then ask anything about it.</p>
            </div>

          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  
                  {msg.role === "user" ? (
                    /* User Bubble */
                    <div className="bg-[var(--accent-primary)] text-white text-[14px] font-[400] px-[18px] py-[12px] rounded-[18px_18px_4px_18px] max-w-[65%] shadow-[0_4px_16px_rgba(108,99,255,0.3)] whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  ) : (
                    /* AI Bubble */
                    <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-[14px] font-[400] leading-[1.6] px-[18px] py-[12px] rounded-[18px_18px_18px_4px] max-w-[70%] whitespace-pre-wrap break-words">
                      {msg.content ? msg.content : (
                        /* Thinking Indicator (while empty string is streaming) */
                        isTyping && idx === messages.length - 1 && (
                          <div className="flex items-center gap-1.5 h-5">
                            <span className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
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

        {/* INPUT AREA */}
        <div className="p-[16px_24px] border-t border-[var(--border-subtle)] bg-[var(--bg-base)]">
          <div className="max-w-[800px] mx-auto">
            <div className="flex items-center gap-[12px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-[12px_12px_12px_20px] transition-all focus-within:border-[#6C63FF]/50 focus-within:shadow-[0_0_0_3px_rgba(108,99,255,0.1)]">
              
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask anything about your document..."
                className="flex-1 bg-transparent border-none outline-none text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
              />
              
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="w-[40px] h-[40px] flex items-center justify-center rounded-full shrink-0 transition-all duration-200 
                  disabled:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                  bg-[var(--accent-primary)] text-white hover:scale-105 shadow-[0_4px_16px_rgba(108,99,255,0.4)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="translate-y-[-1px] translate-x-[1px]">
                  <path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>
                </svg>
              </button>

            </div>
          </div>
        </div>
      </main>
      
    </div>
  );
}