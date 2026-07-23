// Landing Page 

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#0A0A0A] font-sans selection:bg-white/30 selection:text-white">
      
      {/* 
        1. THE SPATIAL ENVIRONMENT (Dynamic Background)
        In VisionOS, the background isn't solid. It's a mix of vibrant, ambient colors 
        that shift behind the glass panels.
      */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Soft Violet/Pink Orb */}
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-gradient-to-br from-fuchsia-500/40 to-purple-600/40 blur-[120px] rounded-full animate-pulse-slow mix-blend-screen" />
        {/* Deep Blue/Cyan Orb */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-gradient-to-tl from-blue-600/40 to-cyan-400/40 blur-[120px] rounded-full animate-pulse-slow mix-blend-screen" style={{ animationDelay: "2s" }} />
        {/* Warm Peach/Orange Center Orb */}
        <div className="absolute top-[20%] left-[30%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-gradient-to-tr from-orange-400/20 to-pink-500/20 blur-[100px] rounded-full animate-pulse-slow mix-blend-screen" style={{ animationDelay: "4s" }} />
      </div>

      {/* 
        2. FLOATING GLASS NAVIGATION
        Notice the heavy blur and the inset shadow to simulate light hitting the top edge.
      */}
      <nav className="absolute top-8 z-50 flex items-center justify-between px-6 py-3 w-11/12 max-w-3xl bg-white/[0.05] backdrop-blur-3xl border border-white/[0.1] rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shadow-inner">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <span className="font-semibold tracking-wide text-white/90 text-sm">NEXUS</span>
        </div>
        <div className="flex gap-6 text-[13px] font-medium text-white/60">
          <span className="text-white drop-shadow-md">Environment</span>
          <span className="hover:text-white transition-colors cursor-pointer">Security</span>
          <span className="hover:text-white transition-colors cursor-pointer">Specs</span>
        </div>
      </nav>

      {/* 
        3. THE MAIN SPATIAL WINDOW
        This is the core VisionOS element. A massive pane of frosted glass.
      */}
      <main className="relative z-10 w-11/12 max-w-4xl p-10 md:p-16 flex flex-col items-center text-center bg-white/[0.03] backdrop-blur-[40px] border border-white/[0.08] rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_0_20px_rgba(255,255,255,0.02)]">
        
        {/* Subtle Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-medium text-white/80 mb-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          Spatial RAG Active
        </div>

        {/* VisionOS Typography (Soft white, distinct text shadows for legibility over glass) */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white/95 leading-[1.1] mb-6 drop-shadow-lg">
          Immerse yourself <br />
          in your knowledge.
        </h1>

        <p className="text-lg text-white/70 max-w-2xl mb-12 font-medium leading-relaxed drop-shadow-md">
          A seamless, spatial interface for your documents. Upload PDFs to the local vector engine and interact with your personal AI assistant.
        </p>

        {/* 
          Glass Action Buttons
          Notice how the primary button is highly translucent but uses light physics to pop.
        */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/chat"
            className="px-8 py-4 bg-white/[0.15] hover:bg-white/[0.25] text-white rounded-full font-semibold transition-all active:scale-95 border border-white/[0.2] shadow-[0_8px_16px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.5)] flex items-center gap-2 backdrop-blur-md"
          >
            Enter Workspace
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
          <button className="px-8 py-4 bg-black/20 hover:bg-black/40 text-white/80 rounded-full font-semibold transition-all active:scale-95 border border-white/[0.05] backdrop-blur-md">
            View Architecture
          </button>
        </div>
      </main>

      {/* 
        4. FLOATING DEPTH ELEMENTS (The Spatial effect)
        These smaller glass cards float in front of and behind the main window 
        to create genuine 3D spatial tension.
      */}
      <div className="absolute top-[20%] left-[5%] md:left-[15%] z-20 w-48 p-4 bg-white/[0.05] backdrop-blur-3xl border border-white/[0.1] rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] hidden lg:flex flex-col gap-3 animate-float-slow">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        </div>
        <div className="w-full h-2 rounded-full bg-white/20" />
        <div className="w-2/3 h-2 rounded-full bg-white/10" />
      </div>

      <div className="absolute bottom-[15%] right-[5%] md:right-[15%] z-0 w-56 p-5 bg-white/[0.02] backdrop-blur-[20px] border border-white/[0.05] rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] hidden lg:flex flex-col gap-3 animate-float-medium">
        <div className="flex items-center gap-2 mb-2">
           <div className="w-2 h-2 rounded-full bg-green-400" />
           <span className="text-xs font-medium text-white/60">Vector Sync</span>
        </div>
        <div className="w-full h-12 rounded-xl bg-white/5 border border-white/5" />
      </div>

      {/* Required CSS for the gentle spatial floating and pulsing */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.8; }
          50% { transform: scale(1.05) translate(20px, -20px); opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 4.5s ease-in-out infinite; }
      `}} />
    </div>
  );
}