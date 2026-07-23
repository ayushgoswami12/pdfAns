"use client";

import { useState, useRef, useEffect } from "react";

const API = "http://192.168.167.133:8000";

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Welcome Animation State
  const [welcomeText, setWelcomeText] = useState("");
  
  // Sidebar & Responsive states
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

  // Auto-scroll to bottom of chat
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

  // --- TYPING ANIMATION EFFECT ---
  useEffect(() => {
    if (messages.length > 0) return;
    
    const fullText = "Welcome.";
    let currentIndex = 0;
    setWelcomeText(""); 
    
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setWelcomeText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 120); 

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
      { role: "assistant", content: `This is a simulated history for "${title}".\n\nTo make this real, we will need to connect this to a backend endpoint like \`/api/chat/\${chatId}\` that returns your saved messages.` }
    ]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    
    if (messages.length === 0) setActiveChatId(null);

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
    <div className="flex h-[100dvh] w-full bg-[#020617] text-slate-200 font-sans antialiased overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200 p-0 md:p-3 gap-0 relative">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`absolute top-6 md:top-8 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-4 px-6 md:px-8 py-4 rounded-full shadow-2xl backdrop-blur-xl border animate-in fade-in slide-in-from-top-4 duration-300 max-w-[90vw]
          ${toast.type === 'success' ? 'bg-[#0f172a]/95 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10' : 
            toast.type === 'info' ? 'bg-[#0f172a]/95 border-blue-500/30 text-blue-400 shadow-blue-500/10' : 
            'bg-[#0f172a]/95 border-rose-500/30 text-rose-400 shadow-rose-500/10'}`}>
          <div className="w-2.5 h-2.5 rounded-full bg-current shrink-0 animate-pulse" />
          <span className="text-[14px] md:text-[15px] font-medium tracking-wide truncate">{toast.message}</span>
        </div>
      )}

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* LEFT PANEL / SIDEBAR */}
      <aside className={`
        fixed md:relative top-0 left-0 h-full z-50 md:z-10
        w-[85%] max-w-[320px] md:max-w-none md:w-[320px] lg:w-[360px] 
        flex flex-col bg-[#020617] p-6 md:pr-8 md:pl-4 md:py-6
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        
        {/* Workspace Brand Header */}
        <div className="flex items-center justify-between mb-12 px-2">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-[17px] font-bold text-slate-100 tracking-tight truncate">Nexus Space</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
            <button 
              onClick={handleNewChat}
              className="hidden md:flex w-10 h-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all shrink-0 shadow-sm"
              title="New Chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-10 px-2">
          
          {/* Knowledge Base Section */}
          <div className="flex flex-col">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full group py-3"
            >
              <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M3 15h6"/><path d="M3 18h6"/>
                </svg>
                <h2 className="text-[12px] font-bold uppercase tracking-widest">Indexed Docs</h2>
              </div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                className={`text-slate-500 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {sources.length === 0 ? (
                  <p className="text-[13px] text-slate-600 py-3 font-medium">No documents uploaded.</p>
                ) : (
                  sources.map((source, idx) => (
                    <div key={idx} className="relative group flex items-center gap-4 py-2.5 px-3 -mx-3 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0 pr-8">
                        <p className="text-[14px] font-medium text-slate-300 group-hover:text-slate-100 truncate">{source.name}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveSource(source.name); }}
                        className="absolute right-3 w-8 h-8 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-rose-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Chat History Section */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 text-slate-400 mb-4 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <h2 className="text-[12px] font-bold uppercase tracking-widest">Recent Activity</h2>
            </div>
            
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <button 
                  key={chat.id} 
                  onClick={() => handleLoadHistory(chat.id, chat.title)}
                  className={`w-full flex items-center gap-4 py-3 px-4 -mx-4 rounded-xl transition-all text-left group
                    ${activeChatId === chat.id ? 'bg-indigo-600/10 text-indigo-400' : 'hover:bg-slate-800/50 text-slate-400'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] font-medium truncate w-full transition-colors 
                      ${activeChatId === chat.id ? 'text-indigo-300' : 'group-hover:text-slate-200'}`}>
                      {chat.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Desktop Upload Action */}
        <div className="mt-8 px-2 hidden md:block">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-14 w-full bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 font-medium text-[14px]"
          >
            {isUploading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin shrink-0" />
                Processing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload File
              </>
            )}
          </button>
        </div>
      </aside>

      {/* RIGHT PANEL (Chat Interface) */}
      <main className="flex-1 flex flex-col relative bg-[#0f172a] md:rounded-[32px] overflow-hidden z-10 w-full min-w-0 shadow-2xl md:ring-1 ring-white/5">
        
        {/* Chat Header */}
        <header className="px-6 md:px-10 py-5 md:py-8 border-b border-white/5 flex-shrink-0 flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
              </svg>
            </button>
            <div>
              <h2 className="text-[17px] font-semibold text-slate-100 flex items-center gap-3">
                Nexus Assistant
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[11px] font-bold uppercase tracking-widest border border-indigo-500/20 hidden sm:inline-block">Beta</span>
              </h2>
            </div>
          </div>
          
          <button 
            onClick={handleNewChat}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 shrink-0 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </header>

        {/* Message Stream View */}
        <div className="flex-1 overflow-y-auto px-6 md:px-12 pb-40 md:pb-48 pt-10 md:pt-16 scroll-smooth custom-scrollbar">
          {messages.length === 0 ? (
            
            /* --- SPACIOUS WELCOME ANIMATION --- */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto pb-20">
              <h1 
                className="text-6xl md:text-8xl text-slate-100 tracking-tight flex items-center justify-center h-32 md:h-40 mb-8"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {welcomeText}
                <span className="inline-block w-[4px] md:w-[5px] h-[50px] md:h-[80px] ml-2 bg-indigo-500 animate-pulse rounded-full opacity-80" />
              </h1>
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-both mt-6">
                <p className="text-[16px] md:text-[18px] text-slate-400 leading-relaxed max-w-md mx-auto font-medium">
                  Upload a document to your knowledge base and start asking questions securely.
                </p>
              </div>
            </div>
            /* --------------------------------- */

          ) : (
            <div className="max-w-4xl mx-auto space-y-12">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                  
                  {msg.role === "assistant" ? (
                    <div className="flex gap-6 max-w-[95%] md:max-w-[90%]">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2L2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                        </svg>
                      </div>
                      <div className="text-[15px] md:text-[16px] leading-relaxed whitespace-pre-wrap break-words text-slate-300 pt-1.5">
                        {msg.content}
                        {isTyping && idx === messages.length - 1 && (
                          <span className="ml-1.5 inline-block w-2.5 h-5 bg-indigo-500 animate-pulse align-middle" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[85%] text-[15px] md:text-[16px] leading-relaxed whitespace-pre-wrap break-words bg-indigo-600 text-white px-7 py-5 rounded-[28px] rounded-tr-[8px] font-medium shadow-xl shadow-indigo-900/20">
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} className="h-8 md:h-12" />
            </div>
          )}
        </div>

        {/* Spacious Docked Input Box Area */}
        <div className="absolute bottom-0 left-0 right-0 pt-16 pb-6 md:pb-10 px-6 md:px-12 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end gap-3 md:gap-4 bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 rounded-[28px] p-3 focus-within:border-indigo-500/50 focus-within:bg-[#1e293b] transition-all shadow-2xl">
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="mb-1.5 ml-1.5 w-11 h-11 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50 shrink-0 border border-transparent"
                title="Attach Document"
              >
                {isUploading ? (
                  <span className="w-5 h-5 border-[2.5px] border-slate-500 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                placeholder="Message Nexus..."
                className="flex-1 max-h-40 min-h-[52px] bg-transparent outline-none text-[16px] text-slate-100 placeholder:text-slate-500 px-3 py-3.5 resize-none custom-scrollbar"
                rows={1}
              />
              
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="mb-1.5 mr-1.5 w-11 h-11 flex items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-20 disabled:bg-slate-800 disabled:text-slate-500 transition-all active:scale-95 shrink-0 shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="translate-y-[0px] translate-x-[1px]">
                  <path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>
                </svg>
              </button>
            </div>
            
            <p className="text-center text-[12px] text-slate-500 mt-5 font-medium tracking-wide">
              Nexus can make mistakes. Consider verifying critical information.
            </p>
          </div>
        </div>
      </main>
      
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
        
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #475569; }
      `}} />
    </div>
  );
}