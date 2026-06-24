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
    // 1. Instantly remove it from the UI so it feels fast
    setSources((prev) => prev.filter(source => source.name !== nameToRemove));
    
    // 2. Tell the Python backend to erase it from ChromaDB
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
    <div className="flex h-screen w-full bg-black text-zinc-100 font-sans antialiased overflow-hidden selection:bg-zinc-800 selection:text-white p-3 gap-3 relative">
      
      {/* Toast Notification (Sleeker, top-centered) */}
      {toast.show && (
        <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-2xl shadow-black/50 backdrop-blur-xl border animate-in fade-in slide-in-from-top-4 duration-300
          ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
            toast.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 
            'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
          <span className="text-sm font-medium tracking-tight">{toast.message}</span>
        </div>
      )}

      {/* LEFT PANEL */}
      <aside className="w-[320px] flex flex-col gap-3">
        
        {/* Sources Grid */}
        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-3xl p-5 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-sm font-medium tracking-tight text-zinc-300">Knowledge Base</h2>
            <span className="text-[10px] font-bold text-zinc-600 bg-white/5 px-2 py-0.5 rounded-full">{sources.length}</span>
          </div>
          
          {sources.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-zinc-600 text-sm border border-dashed border-white/10 rounded-2xl">
              Knowledge base is empty
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {sources.map((source, idx) => (
                <div key={idx} className="relative aspect-[4/5] bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 flex flex-col hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 group cursor-pointer overflow-hidden">
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveSource(source.name); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 scale-95 hover:scale-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>

                  <div className="flex items-center gap-2 mb-3">
                     <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-zinc-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                  </div>

                  {/* Clean Skeleton UI */}
                  <div className="flex-1 bg-black/20 rounded-lg border border-white/5 p-2.5 flex flex-col gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="w-3/4 h-1 bg-white/20 rounded-full" />
                    <div className="w-full h-1 bg-white/10 rounded-full mt-1" />
                    <div className="w-5/6 h-1 bg-white/10 rounded-full" />
                    <div className="w-full h-1 bg-white/10 rounded-full" />
                    <div className="w-4/5 h-1 bg-white/10 rounded-full mt-1" />
                    <div className="w-2/3 h-1 bg-white/10 rounded-full" />
                  </div>

                  <div className="mt-3 pr-2">
                    <p className="text-xs font-medium text-zinc-200 truncate" title={source.name}>{source.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-medium tracking-wide">{source.size}</p>
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
          className="h-16 w-full bg-zinc-100 text-black hover:bg-white rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group font-medium text-sm shadow-xl shadow-white/5"
        >
          {isUploading ? (
            <>
              <span className="w-4 h-4 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-y-0.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Upload Document
            </>
          )}
        </button>
        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
      </aside>

      {/* RIGHT PANEL (Chat Interface) */}
      <main className="flex-1 flex flex-col relative bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Floating Header */}
        <header className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
        <div className="absolute top-5 right-5 z-20">
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 pb-36 pt-8 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-5 animate-in fade-in duration-700">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-2xl shadow-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div>
                <h1 className="text-xl font-medium text-zinc-100 tracking-tight">How can I help you?</h1>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">Query your configured knowledge base to instantly retrieve and synthesize document data.</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] text-[15px] leading-relaxed whitespace-pre-wrap 
                    ${msg.role === "user"
                      ? "bg-zinc-100 text-black px-5 py-3 rounded-3xl rounded-tr-sm shadow-xl shadow-white/5 font-medium"
                      : "text-zinc-300 py-2" 
                    }`}>
                    
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-5 h-5 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-zinc-100 text-[9px] font-bold tracking-widest">AI</div>
                        <span className="text-xs font-medium text-zinc-400 tracking-tight">Assistant</span>
                      </div>
                    )}
                    
                    {msg.content ? (
                      <div className="inline-block">
                        {msg.content}
                        {isTyping && idx === messages.length - 1 && (
                          <span className="ml-1 inline-block w-1.5 h-[15px] bg-zinc-300 animate-pulse align-middle" />
                        )}
                      </div>
                    ) : (
                      isTyping && idx === messages.length - 1 && (
                        <div className="flex items-center gap-1.5 h-6 mt-1 ml-1">
                          <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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

        {/* Floating Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-20 pb-6 px-8 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <div className="relative flex items-end gap-2 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-2 shadow-2xl shadow-black focus-within:bg-white/[0.05] focus-within:border-white/20 transition-all duration-300">
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
                className="flex-1 max-h-32 min-h-[44px] bg-transparent outline-none text-[15px] text-zinc-100 placeholder:text-zinc-600 px-4 py-3 resize-none custom-scrollbar"
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="mb-1 mr-1 w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-100 text-black disabled:opacity-30 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all active:scale-95 flex-shrink-0 shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="translate-x-[1px] -translate-y-[1px]"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
              </button>
            </div>
            <p className="text-center text-[11px] text-zinc-600 mt-4 font-medium tracking-wide">
              AI can make mistakes. Consider verifying important information.
            </p>
          </div>
        </div>
      </main>
      
      {/* Optional global styles for hidden scrollbars */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}