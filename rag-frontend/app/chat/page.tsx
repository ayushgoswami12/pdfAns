"use client";

import { useState, useRef, useEffect } from "react";

const API = "http://192.168.167.133:8000";

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: "", type: 'success' });
  const [sources, setSources] = useState<{ name: string; size: string }[]>([
    { name: "Machine learning.pdf", size: "Pre-loaded Database" }
  ]);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: 'success' }), 3000);
  };

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
      const res = await fetch(`${API}/api/upload`, {
        method: "POST",
        body: formData,
      });
      await res.json();
      
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
    <div className="flex h-screen w-full bg-[#0A0A0A] text-zinc-100 font-sans antialiased overflow-hidden selection:bg-zinc-800 selection:text-white p-4 gap-4 relative">
      
      {/* Crisp Toast Notification */}
      {toast.show && (
        <div className={`absolute top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border animate-in fade-in slide-in-from-top-6 duration-300
          ${toast.type === 'success' ? 'bg-[#121212] border-emerald-500/30 text-emerald-400' : 
            toast.type === 'info' ? 'bg-[#121212] border-blue-500/30 text-blue-400' : 
            'bg-[#121212] border-rose-500/30 text-rose-400'}`}>
          <div className="w-2 h-2 rounded-full bg-current" />
          <span className="text-sm font-medium tracking-tight">{toast.message}</span>
        </div>
      )}

      {/* LEFT PANEL */}
      <aside className="w-[340px] flex flex-col gap-4 z-10">
        
        {/* Logo/Header */}
        <div className="bg-[#121212] border border-zinc-800/80 rounded-[24px] p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Nexus</h1>
              <p className="text-[11px] text-zinc-500 font-medium tracking-wide">Enterprise Workspace</p>
            </div>
          </div>
        </div>

        {/* Sources Grid */}
        <div className="flex-1 bg-[#121212] border border-zinc-800/80 rounded-[24px] p-5 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[13px] font-semibold tracking-tight text-zinc-400">Knowledge Base</h2>
            <span className="text-[11px] font-bold text-zinc-500 bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-700">{sources.length}</span>
          </div>
          
          {sources.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-2xl">
              <p className="font-medium">No documents indexed</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sources.map((source, idx) => (
                <div key={idx} className="relative bg-[#1A1A1A] border border-zinc-800 rounded-xl p-3 flex items-center gap-3 hover:border-zinc-600 transition-colors duration-200 group cursor-pointer overflow-hidden">
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveSource(source.name); }}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-rose-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>

                  <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0 pr-8">
                    <p className="text-[13px] font-medium text-zinc-200 truncate" title={source.name}>{source.name}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">{source.size}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="h-16 w-full bg-zinc-100 text-zinc-950 hover:bg-white rounded-[20px] flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-medium text-[15px]"
        >
          {isUploading ? (
            <>
              <span className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/>
                <path d="M12 5v14"/>
              </svg>
              Add Document
            </>
          )}
        </button>
        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
      </aside>

      {/* RIGHT PANEL (Chat Interface) */}
      <main className="flex-1 flex flex-col relative bg-[#121212] border border-zinc-800/80 rounded-[24px] overflow-hidden z-10">
        
        {/* Chat Header */}
        <header className="px-8 py-5 border-b border-zinc-800/80 bg-[#121212]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-zinc-800 flex items-center justify-center text-zinc-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-zinc-100">AI Assistant</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                  <p className="text-[11px] text-zinc-500 font-medium tracking-wide">Ready</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 pb-32 pt-8 scroll-smooth custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-5 animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center border border-zinc-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-medium text-zinc-100 tracking-tight">How can I help you?</h1>
                <p className="text-[13px] text-zinc-500 mt-2 leading-relaxed">Ask a question to securely search and retrieve information from your indexed documents.</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] text-[15px] leading-relaxed whitespace-pre-wrap 
                    ${msg.role === "user"
                      ? "bg-zinc-100 text-zinc-950 px-5 py-3.5 rounded-[20px] rounded-tr-[4px] font-medium"
                      : "text-zinc-300 py-2" 
                    }`}>
                    
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-6 h-6 rounded-md bg-[#1A1A1A] border border-zinc-800 flex items-center justify-center text-zinc-300 text-[10px] font-bold">AI</div>
                        <span className="text-xs font-semibold text-zinc-500">Assistant</span>
                      </div>
                    )}
                    
                    {msg.content ? (
                      <div className="inline-block">
                        {msg.content}
                        {isTyping && idx === messages.length - 1 && (
                          <span className="ml-1 inline-block w-1.5 h-4 bg-zinc-400 animate-pulse align-middle" />
                        )}
                      </div>
                    ) : (
                      isTyping && idx === messages.length - 1 && (
                        <div className="flex items-center gap-1.5 h-6 mt-1 ml-1">
                          <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} className="h-6" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#121212] pt-6 pb-6 px-8 border-t border-zinc-800/80">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-[#1A1A1A] border border-zinc-800 rounded-2xl p-2 focus-within:border-zinc-600 transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask a question..."
                className="flex-1 max-h-32 min-h-[44px] bg-transparent outline-none text-[15px] text-zinc-100 placeholder:text-zinc-500 px-4 py-3 resize-none custom-scrollbar"
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="mb-1 mr-1 w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-950 disabled:opacity-20 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all active:scale-95 flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="translate-x-[1px] -translate-y-[1px]">
                  <path d="m5 12 7-7 7 7"/>
                  <path d="M12 19V5"/>
                </svg>
              </button>
            </div>
            
            {/* new  */}
            <p className="text-center text-[11px] text-zinc-600 mt-4 font-medium">
              AI can make mistakes. Consider verifying important information.
            </p>
          </div>
        </div>
      </main>
      
      {/* Custom scrollbar styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #3f3f46; }
      `}} />
    </div>
  );
}