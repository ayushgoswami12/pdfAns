"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#FCFCFD] font-[family-name:var(--font-inter)] selection:bg-red-200 selection:text-red-900">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 h-[72px] z-50 flex items-center justify-between px-6 md:px-12 bg-white/70 backdrop-blur-xl border-b border-gray-200/60 transition-all duration-300">
        <div className="flex items-center gap-1.5 tracking-tight">
          <span className="font-[family-name:var(--font-syne)] text-[22px] font-bold text-gray-900">Scholar</span>
          <span className="font-[family-name:var(--font-syne)] text-[22px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF3366] to-[#CC0000]">AI</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="#" className="text-gray-500 hover:text-gray-900 text-[14.5px] font-medium transition-colors hidden sm:block">
            GitHub
          </a>
          <Link 
            href="/chat" 
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF3366] to-[#CC0000] text-white text-[14px] font-semibold hover:shadow-[0_4px_16px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95 transition-all duration-300"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden">
        
        {/* Layer 1: Radial Gradient */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(220,38,38,0.08) 0%, transparent 70%)" }}
        />

        {/* Layer 2: Subtle Grid Lines */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.8) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 80%)"
          }}
        />

        {/* Layer 3: 3D Floating Orb */}
        <div 
          className="absolute z-0 w-[400px] h-[400px] opacity-[0.08] blur-[60px] pointer-events-none"
          style={{
            top: "calc(50% - 200px)",
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
            background: "conic-gradient(from 180deg, #FF3366, #FFB3C6, #CC0000, #FF3366)",
            animation: "float 8s ease-in-out infinite"
          }}
        />

        {/* Layer 4: Smaller Sharp Orb */}
        <div 
          className="absolute z-0 w-[150px] h-[150px] blur-[30px] pointer-events-none"
          style={{
            top: "calc(50% - 100px)",
            background: "radial-gradient(circle, rgba(255,51,102,0.3), transparent)",
            animation: "pulse-orb 4s ease-in-out infinite"
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-5xl text-center mt-12">
          
          <div 
            className="mb-8 px-4 py-1.5 rounded-full text-[11px] font-bold text-red-600 bg-red-50 border border-red-100/80 tracking-[0.2em] uppercase shadow-[0_2px_8px_rgba(220,38,38,0.05)]"
            style={{ animation: "fadeInUp 0.6s ease 0.1s both" }}
          >
            Powered by Mistral AI + ChromaDB
          </div>

          <h1 
            className="font-[family-name:var(--font-syne)] text-[48px] sm:text-[64px] md:text-[80px] font-[800] leading-[1.05] tracking-tight max-w-[800px]"
            style={{ animation: "fadeInUp 0.6s ease 0.2s both" }}
          >
            <span className="block text-gray-900">Ask Anything</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#FF3366] to-[#CC0000] drop-shadow-[0_2px_20px_rgba(220,38,38,0.2)] pb-2">
              About Your PDFs.
            </span>
          </h1>

          <p 
            className="mt-6 text-[18px] font-medium text-gray-500 max-w-[540px] leading-[1.6]"
            style={{ animation: "fadeInUp 0.6s ease 0.35s both" }}
          >
            Upload any PDF. Ask questions. Get precise answers — streamed in real time from your document, not the internet.
          </p>

          <Link
            href="/chat"
            className="mt-12 px-10 py-4 rounded-full bg-gradient-to-r from-[#FF3366] to-[#CC0000] text-white text-[16px] font-semibold group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95"
            style={{
              animation: "fadeInUp 0.6s ease 0.5s both",
              boxShadow: "0 8px 30px rgba(220,38,38,0.25), 0 0 0 1px rgba(220,38,38,0.1)"
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Enter the Chat <span className="group-hover:translate-x-1.5 transition-transform duration-300">→</span>
            </span>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300" />
          </Link>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 flex flex-col items-center opacity-40 z-10">
          <div className="w-[2px] h-[48px] bg-gray-200 rounded-full relative overflow-hidden">
            <div className="w-full h-1/2 bg-red-500 absolute top-0 rounded-full" style={{ animation: "scrollDot 2s ease-in-out infinite" }} />
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-[120px] px-6 mx-auto max-w-[1200px] w-full relative z-10">
        
        <div className="text-center mb-4">
          <span className="text-[12px] font-bold text-gray-400 tracking-[0.2em] uppercase">
            How It Works
          </span>
        </div>
        
        <h2 className="text-center font-[family-name:var(--font-syne)] text-[36px] md:text-[42px] font-[800] text-gray-900 mb-16 tracking-tight">
          Intelligence from your documents
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="group relative bg-white border border-gray-200/60 rounded-3xl p-[40px] overflow-hidden transition-all duration-400 hover:border-red-200 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(220,38,38,0.08)]">
            <div className="absolute top-0 left-[40px] right-[40px] h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-400" style={{ background: "linear-gradient(to right, transparent, #FF3366, transparent)" }} />
            <div className="w-[56px] h-[56px] rounded-2xl bg-red-50 flex items-center justify-center mb-6 ring-1 ring-red-100 group-hover:bg-red-500 transition-colors duration-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 group-hover:text-white transition-colors duration-400">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h3 className="font-bold text-[19px] text-gray-900 mb-3 tracking-tight">Upload Any PDF</h3>
            <p className="text-[15px] text-gray-500 font-medium leading-[1.6]">
              Drop in research papers, textbooks, contracts — any PDF instantly becomes queryable.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-white border border-gray-200/60 rounded-3xl p-[40px] overflow-hidden transition-all duration-400 hover:border-red-200 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(220,38,38,0.08)]">
            <div className="absolute top-0 left-[40px] right-[40px] h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-400" style={{ background: "linear-gradient(to right, transparent, #FF3366, transparent)" }} />
            <div className="w-[56px] h-[56px] rounded-2xl bg-red-50 flex items-center justify-center mb-6 ring-1 ring-red-100 group-hover:bg-red-500 transition-colors duration-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 group-hover:text-white transition-colors duration-400">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
            <h3 className="font-bold text-[19px] text-gray-900 mb-3 tracking-tight">Semantic Search</h3>
            <p className="text-[15px] text-gray-500 font-medium leading-[1.6]">
              MMR retrieval finds the 4 most relevant, diverse chunks from your document automatically.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-white border border-gray-200/60 rounded-3xl p-[40px] overflow-hidden transition-all duration-400 hover:border-red-200 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(220,38,38,0.08)]">
            <div className="absolute top-0 left-[40px] right-[40px] h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-400" style={{ background: "linear-gradient(to right, transparent, #FF3366, transparent)" }} />
            <div className="w-[56px] h-[56px] rounded-2xl bg-red-50 flex items-center justify-center mb-6 ring-1 ring-red-100 group-hover:bg-red-500 transition-colors duration-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 group-hover:text-white transition-colors duration-400">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h3 className="font-bold text-[19px] text-gray-900 mb-3 tracking-tight">Real-time Streaming</h3>
            <p className="text-[15px] text-gray-500 font-medium leading-[1.6]">
              Answers stream token by token from Mistral AI — no waiting, no loading spinner.
            </p>
          </div>

        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section 
        className="py-[100px] px-6 text-center border-y border-gray-200/60 bg-white"
        style={{ backgroundImage: "radial-gradient(circle at 50% 0%, rgba(220,38,38,0.03) 0%, transparent 70%)" }}
      >
        <h2 className="font-[family-name:var(--font-syne)] text-[36px] md:text-[48px] font-[800] text-gray-900 mb-10 tracking-tight">
          Ready to talk to your documents?
        </h2>
        <Link
          href="/chat"
          className="inline-flex px-12 py-4.5 rounded-full bg-gradient-to-r from-[#FF3366] to-[#CC0000] text-white text-[16px] font-bold group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95"
          style={{ boxShadow: "0 8px 30px rgba(220,38,38,0.25), 0 0 0 1px rgba(220,38,38,0.1)" }}
        >
          <span className="relative z-10 flex items-center gap-2">
            Open ScholarAI <span className="group-hover:translate-x-1.5 transition-transform duration-300">→</span>
          </span>
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-300" />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="py-[40px] px-6 md:px-12 bg-[#FCFCFD] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-1">
          <span className="font-[family-name:var(--font-syne)] text-[18px] font-bold text-gray-900">Scholar</span>
          <span className="font-[family-name:var(--font-syne)] text-[18px] font-bold text-red-600">AI</span>
        </div>
        <div className="text-[13px] font-medium text-gray-400 text-center tracking-wide">
          Built with MistralAI · ChromaDB · Next.js
        </div>
        <div className="text-[13px] font-medium text-gray-400 tracking-wide">
          © 2026
        </div>
      </footer>

    </main>
  );
}