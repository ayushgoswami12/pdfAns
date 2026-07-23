"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col font-[family-name:var(--font-inter)]">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 h-[64px] z-50 flex items-center justify-between px-6 md:px-12 bg-[#080A0F]/80 backdrop-blur-[20px] border-b border-border-subtle">
        <div className="flex items-center">
          <span className="font-[family-name:var(--font-syne)] text-[20px] font-semibold text-text-primary">Scholar</span>
          <span className="font-[family-name:var(--font-syne)] text-[20px] font-semibold text-accent-primary">AI</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-text-secondary hover:text-text-primary text-sm transition-colors hidden sm:block">
            GitHub
          </a>
          <Link 
            href="/chat" 
            className="px-5 py-2 rounded-full bg-accent-primary text-white text-sm font-medium hover:brightness-110 shadow-[var(--glow-accent)] transition-all"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        
        {/* Layer 1: Radial Gradient */}
        <div 
          className="absolute inset-0 z-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(108,99,255,0.12) 0%, transparent 70%)" }}
        />

        {/* Layer 2: Grid Lines */}
        <div 
          className="absolute inset-0 z-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(rgba(30,32,48,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(30,32,48,0.6) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 100%)"
          }}
        />

        {/* Layer 3: 3D Floating Orb */}
        <div 
          className="absolute z-0 w-[320px] h-[320px] opacity-15 blur-[60px]"
          style={{
            top: "calc(50% - 180px)",
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
            background: "conic-gradient(from 180deg, #6C63FF, #A78BFA, #38BDF8, #6C63FF)",
            animation: "float 8s ease-in-out infinite"
          }}
        />

        {/* Layer 4: Smaller Sharp Orb */}
        <div 
          className="absolute z-0 w-[120px] h-[120px] blur-[20px]"
          style={{
            top: "calc(50% - 80px)",
            background: "radial-gradient(circle, rgba(108,99,255,0.6), transparent)",
            animation: "pulse-orb 4s ease-in-out infinite"
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center px-4 w-full max-w-4xl text-center">
          
          <div 
            className="mb-8 px-[14px] py-[6px] rounded-full text-[11px] font-[family-name:var(--font-mono)] text-accent-primary bg-[#6C63FF]/10 border border-[#6C63FF]/30 tracking-[0.15em] uppercase"
            style={{ animation: "fadeInUp 0.6s ease 0.1s both" }}
          >
            POWERED BY MISTRAL AI + CHROMADB
          </div>

          <h1 
            className="font-[family-name:var(--font-syne)] text-[42px] md:text-[72px] font-[800] leading-[1.05] tracking-[-0.03em] max-w-[700px]"
            style={{ animation: "fadeInUp 0.6s ease 0.2s both" }}
          >
            <span className="block text-text-primary">Ask Anything</span>
            <span className="block text-accent-primary drop-shadow-[0_0_40px_rgba(108,99,255,0.5)]">
              About Your PDFs.
            </span>
          </h1>

          <p 
            className="mt-5 text-[17px] font-[300] text-text-secondary max-w-[480px] leading-[1.7]"
            style={{ animation: "fadeInUp 0.6s ease 0.35s both" }}
          >
            Upload any PDF. Ask questions. Get precise answers — streamed in real time from your document, not the internet.
          </p>

          <Link
            href="/chat"
            className="mt-10 px-10 py-4 rounded-full bg-accent-primary text-white text-[15px] font-[600] group relative overflow-hidden transition-all duration-200"
            style={{
              animation: "fadeInUp 0.6s ease 0.5s both",
              boxShadow: "0 0 0 1px rgba(108,99,255,0.5), 0 8px 32px rgba(108,99,255,0.3)"
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Enter the Chat <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
            {/* Hover state styling applied via global hover in tailwind, overriding shadow */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
          </Link>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 flex flex-col items-center opacity-50 z-10">
          <div className="w-[2px] h-[40px] bg-accent-primary/30 rounded-full relative overflow-hidden">
            <div className="w-full h-1/2 bg-accent-primary absolute top-0 rounded-full" style={{ animation: "scrollDot 1.5s ease-in-out infinite" }} />
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-[120px] px-6 mx-auto max-w-[1100px] w-full">
        
        <div className="text-center mb-4">
          <span className="font-[family-name:var(--font-mono)] text-[11px] text-accent-primary tracking-[0.15em] uppercase">
            HOW IT WORKS
          </span>
        </div>
        
        <h2 className="text-center font-[family-name:var(--font-syne)] text-[36px] font-[700] text-text-primary mb-16">
          Intelligence from your documents
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="group relative bg-bg-surface border border-border-subtle rounded-lg p-[32px] overflow-hidden transition-all duration-300 hover:border-[var(--border-glow)] hover:-translate-y-1 hover:shadow-[var(--shadow-card),var(--glow-accent)]">
            <div className="absolute top-0 left-[32px] right-[32px] h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(to right, transparent, var(--accent-primary), transparent)" }} />
            <div className="w-[48px] h-[48px] rounded-[var(--radius-md)] bg-[#6C63FF]/10 flex items-center justify-center mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h3 className="font-semibold text-[17px] text-text-primary mb-2.5">Upload Any PDF</h3>
            <p className="text-[14px] text-text-secondary font-[400] leading-[1.6]">
              Drop in research papers, textbooks, contracts — any PDF instantly becomes queryable.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-bg-surface border border-border-subtle rounded-lg p-[32px] overflow-hidden transition-all duration-300 hover:border-[var(--border-glow)] hover:-translate-y-1 hover:shadow-[var(--shadow-card),var(--glow-accent)]">
            <div className="absolute top-0 left-[32px] right-[32px] h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(to right, transparent, var(--accent-primary), transparent)" }} />
            <div className="w-[48px] h-[48px] rounded-[var(--radius-md)] bg-[#6C63FF]/10 flex items-center justify-center mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
            <h3 className="font-semibold text-[17px] text-text-primary mb-2.5">Semantic Search</h3>
            <p className="text-[14px] text-text-secondary font-[400] leading-[1.6]">
              MMR retrieval finds the 4 most relevant, diverse chunks from your document automatically.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-bg-surface border border-border-subtle rounded-lg p-[32px] overflow-hidden transition-all duration-300 hover:border-[var(--border-glow)] hover:-translate-y-1 hover:shadow-[var(--shadow-card),var(--glow-accent)]">
            <div className="absolute top-0 left-[32px] right-[32px] h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(to right, transparent, var(--accent-primary), transparent)" }} />
            <div className="w-[48px] h-[48px] rounded-[var(--radius-md)] bg-[#6C63FF]/10 flex items-center justify-center mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h3 className="font-semibold text-[17px] text-text-primary mb-2.5">Real-time Streaming</h3>
            <p className="text-[14px] text-text-secondary font-[400] leading-[1.6]">
              Answers stream token by token from Mistral AI — no waiting, no loading spinner.
            </p>
          </div>

        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section 
        className="py-[80px] px-[40px] text-center border-y border-border-subtle"
        style={{ background: "linear-gradient(135deg, rgba(108,99,255,0.08), rgba(108,99,255,0.03))" }}
      >
        <h2 className="font-[family-name:var(--font-syne)] text-[42px] font-[800] text-text-primary mb-8">
          Ready to talk to your documents?
        </h2>
        <Link
            href="/chat"
            className="inline-flex px-10 py-4 rounded-full bg-accent-primary text-white text-[15px] font-[600] group relative overflow-hidden transition-all duration-200"
            style={{ boxShadow: "0 0 0 1px rgba(108,99,255,0.5), 0 8px 32px rgba(108,99,255,0.3)" }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Open ScholarAI <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="py-[32px] px-6 md:px-[40px] border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center">
          <span className="font-[family-name:var(--font-syne)] text-[16px] font-semibold text-text-primary">Scholar</span>
          <span className="font-[family-name:var(--font-syne)] text-[16px] font-semibold text-accent-primary">AI</span>
        </div>
        <div className="font-[family-name:var(--font-mono)] text-[11px] text-text-tertiary text-center">
          Built with MistralAI · ChromaDB · Next.js
        </div>
        <div className="font-[family-name:var(--font-mono)] text-[11px] text-text-tertiary">
          © 2025
        </div>
      </footer>

    </main>
  );
}