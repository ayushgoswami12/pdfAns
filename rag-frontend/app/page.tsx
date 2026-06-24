import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-zinc-100 overflow-hidden selection:bg-zinc-800 selection:text-white relative">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.03] blur-[120px] rounded-full pointer-events-none" />
      
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Navigation / Logo Area */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <span className="font-semibold tracking-tight text-zinc-200">Nexus AI</span>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto mt-10">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-400 mb-8 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          RAG Engine Online
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500 mb-6">
          Your Knowledge.<br />Instantly Accessible.
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed font-medium">
          Securely upload your documents and interact with your personal knowledge base using an advanced AI assistant powered by Mistral and ChromaDB.
        </p>
        
        {/* Call to Action Button */}
        <Link 
          href="/chat"
          className="px-8 py-4 bg-zinc-100 text-black hover:bg-white rounded-2xl font-semibold transition-all active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] flex items-center gap-3 group"
        >
          Launch Workspace
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </Link>
        
      </main>

      {/* Optional: Floating Interface Mockup Preview to build anticipation */}
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.02] border border-white/10 rounded-t-3xl overflow-hidden backdrop-blur-md opacity-40 pointer-events-none mask-image-gradient">
        <div className="w-full h-12 border-b border-white/5 flex items-center px-6 gap-2">
           <div className="w-3 h-3 rounded-full bg-white/10" />
           <div className="w-3 h-3 rounded-full bg-white/10" />
           <div className="w-3 h-3 rounded-full bg-white/10" />
        </div>
        <div className="p-8 flex gap-4">
           <div className="w-1/3 h-32 rounded-xl bg-white/5" />
           <div className="flex-1 h-32 rounded-xl bg-white/5" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .mask-image-gradient {
          mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
        }
      `}} />
    </div>
  );
}