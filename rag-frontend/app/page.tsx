"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#0A0A0C] text-gray-100 font-[family-name:var(--font-inter)] selection:bg-lime-300 selection:text-black overflow-x-hidden">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 h-[64px] md:h-[72px] z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 bg-[#0A0A0C]/70 backdrop-blur-xl border-b border-zinc-800/60 transition-all duration-300">
        <div className="flex items-center gap-1.5 tracking-tight">
          <span className="font-[family-name:var(--font-syne)] text-[20px] md:text-[22px] font-bold text-white">Scholar</span>
          <span className="font-[family-name:var(--font-syne)] text-[20px] md:text-[22px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E4FF6E] to-[#B9E62E]">AI</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-8">
          <a href="#" className="text-gray-300 hover:text-lime-400 text-[14px] md:text-[14.5px] font-medium transition-colors hidden sm:block">
            GitHub
          </a>
          {/* <Link 
            href="/chat" 
            className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#E4FF6E] to-[#B9E62E] text-black text-[13px] sm:text-[14px] font-bold hover:shadow-[0_4px_16px_rgba(215,255,63,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 whitespace-nowrap"
          >
            Launch App
          </Link> */}
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden pt-[64px] md:pt-[72px]">

        {/* Layer 1: Radial Gradient */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 100% 60% at 50% -10%, rgba(215,255,63,0.08) 0%, transparent 70%)" }}
        />

        {/* Layer 2: Subtle Grid Lines */}
        <div
          className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 80%)"
          }}
        />

        {/* Layer 3: 3D Floating Orb */}
        <div
          className="absolute z-0 w-[250px] sm:w-[300px] md:w-[400px] h-[250px] sm:h-[300px] md:h-[400px] opacity-[0.10] blur-[40px] md:blur-[60px] pointer-events-none"
          style={{
            top: "calc(50% - 150px)",
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
            background: "conic-gradient(from 180deg, #E4FF6E, #F5FFB0, #B9E62E, #E4FF6E)",
            animation: "float 8s ease-in-out infinite"
          }}
        />

        {/* Layer 4: Smaller Sharp Orb */}
        <div
          className="absolute z-0 w-[100px] md:w-[150px] h-[100px] md:h-[150px] blur-[20px] md:blur-[30px] pointer-events-none"
          style={{
            top: "calc(50% - 80px)",
            background: "radial-gradient(circle, rgba(215,255,63,0.35), transparent)",
            animation: "pulse-orb 4s ease-in-out infinite"
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 w-full max-w-5xl text-center pb-12 md:pb-0">

          <div
            className="mb-6 md:mb-8 px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold text-lime-300 bg-lime-400/10 border border-lime-400/20 tracking-[0.15em] sm:tracking-[0.2em] uppercase shadow-[0_2px_8px_rgba(215,255,63,0.06)] text-center max-w-[90vw]"
            style={{ animation: "fadeInUp 0.6s ease 0.1s both" }}
          >
            Powered by Mistral AI + Pinecone
          </div>

          <h1
            className="font-[family-name:var(--font-syne)] text-[40px] sm:text-[56px] md:text-[80px] lg:text-[88px] font-[800] leading-[1.1] md:leading-[1.05] tracking-tight max-w-[900px] px-2"
            style={{ animation: "fadeInUp 0.6s ease 0.2s both" }}
          >
            <span className="block text-white">Ask Anything</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#E4FF6E] to-[#B9E62E] drop-shadow-[0_2px_20px_rgba(215,255,63,0.25)] pb-2">
              About Your PDFs.
            </span>
          </h1>

          <p
            className="mt-5 md:mt-6 text-[15px] sm:text-[16px] md:text-[18px] font-medium text-gray-400 max-w-[90%] sm:max-w-[540px] leading-[1.6] md:leading-[1.6]"
            style={{ animation: "fadeInUp 0.6s ease 0.35s both" }}
          >
            Upload any PDF. Ask questions. Get precise answers — streamed in real time from your document, not the internet.
          </p>

          <Link
            href="/chat"
            className="mt-8 md:mt-12 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#E4FF6E] to-[#B9E62E] text-black text-[15px] md:text-[16px] font-bold group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95"
            style={{
              animation: "fadeInUp 0.6s ease 0.5s both",
              boxShadow: "0 8px 30px rgba(215,255,63,0.3), 0 0 0 1px rgba(215,255,63,0.15)"
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Enter the Chat <span className="group-hover:translate-x-1.5 transition-transform duration-300">→</span>
            </span>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </Link>
        </div>

        {/* Scroll Indicator (Hidden on small mobile for better spacing) */}
        <div className="hidden sm:flex absolute bottom-8 md:bottom-12 flex-col items-center opacity-40 z-10">
          <div className="w-[2px] h-[36px] md:h-[48px] bg-zinc-700 rounded-full relative overflow-hidden">
            <div className="w-full h-1/2 bg-lime-400 absolute top-0 rounded-full" style={{ animation: "scrollDot 2s ease-in-out infinite" }} />
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-[80px] md:py-[120px] px-4 sm:px-6 mx-auto max-w-[1200px] w-full relative z-10">

        <div className="text-center mb-3 md:mb-4">
          <span className="text-[11px] md:text-[12px] font-bold text-gray-500 tracking-[0.2em] uppercase">
            How It Works
          </span>
        </div>

        <h2 className="text-center font-[family-name:var(--font-syne)] text-[32px] sm:text-[36px] md:text-[42px] font-[800] text-white mb-10 md:mb-16 tracking-tight px-2">
          Intelligence from your documents
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

          {/* Card 1 */}
          <div className="group relative bg-zinc-900/60 border border-zinc-800 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-[40px] overflow-hidden transition-all duration-400 hover:border-lime-400/30 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(215,255,63,0.08)]">
            <div className="absolute top-0 left-6 sm:left-8 md:left-[40px] right-6 sm:right-8 md:right-[40px] h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-400" style={{ background: "linear-gradient(to right, transparent, #D7FF3F, transparent)" }} />
            <div className="w-[48px] md:w-[56px] h-[48px] md:h-[56px] rounded-xl md:rounded-2xl bg-lime-400/10 flex items-center justify-center mb-5 md:mb-6 ring-1 ring-lime-400/20 group-hover:bg-lime-400 transition-colors duration-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-lime-400 group-hover:text-black transition-colors duration-400 md:w-[24px] md:h-[24px]">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h3 className="font-bold text-[18px] md:text-[19px] text-white mb-2 md:mb-3 tracking-tight">Upload Any PDF</h3>
            <p className="text-[14px] md:text-[15px] text-gray-400 font-medium leading-[1.6]">
              Drop in research papers, textbooks, contracts — any PDF instantly becomes queryable.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-zinc-900/60 border border-zinc-800 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-[40px] overflow-hidden transition-all duration-400 hover:border-lime-400/30 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(215,255,63,0.08)]">
            <div className="absolute top-0 left-6 sm:left-8 md:left-[40px] right-6 sm:right-8 md:right-[40px] h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-400" style={{ background: "linear-gradient(to right, transparent, #D7FF3F, transparent)" }} />
            <div className="w-[48px] md:w-[56px] h-[48px] md:h-[56px] rounded-xl md:rounded-2xl bg-lime-400/10 flex items-center justify-center mb-5 md:mb-6 ring-1 ring-lime-400/20 group-hover:bg-lime-400 transition-colors duration-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-lime-400 group-hover:text-black transition-colors duration-400 md:w-[24px] md:h-[24px]">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
            <h3 className="font-bold text-[18px] md:text-[19px] text-white mb-2 md:mb-3 tracking-tight">Semantic Search</h3>
            <p className="text-[14px] md:text-[15px] text-gray-400 font-medium leading-[1.6]">
              MMR retrieval pulls the most relevant, diverse chunks from your document automatically.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-zinc-900/60 border border-zinc-800 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-[40px] overflow-hidden transition-all duration-400 hover:border-lime-400/30 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(215,255,63,0.08)] sm:col-span-2 lg:col-span-1 max-w-[600px] mx-auto lg:max-w-none w-full">
            <div className="absolute top-0 left-6 sm:left-8 md:left-[40px] right-6 sm:right-8 md:right-[40px] h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-400" style={{ background: "linear-gradient(to right, transparent, #D7FF3F, transparent)" }} />
            <div className="w-[48px] md:w-[56px] h-[48px] md:h-[56px] rounded-xl md:rounded-2xl bg-lime-400/10 flex items-center justify-center mb-5 md:mb-6 ring-1 ring-lime-400/20 group-hover:bg-lime-400 transition-colors duration-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-lime-400 group-hover:text-black transition-colors duration-400 md:w-[24px] md:h-[24px]">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h3 className="font-bold text-[18px] md:text-[19px] text-white mb-2 md:mb-3 tracking-tight">Real-time Streaming</h3>
            <p className="text-[14px] md:text-[15px] text-gray-400 font-medium leading-[1.6]">
              Answers stream token by token from Mistral AI — no waiting, no loading spinner.
            </p>
          </div>

        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section
        className="py-[80px] md:py-[100px] px-4 sm:px-6 text-center border-y border-zinc-800/60 bg-[#0A0A0C] relative overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 50% 0%, rgba(215,255,63,0.05) 0%, transparent 70%)" }}
        />
        <div className="relative z-10">
          <h2 className="font-[family-name:var(--font-syne)] text-[32px] sm:text-[36px] md:text-[48px] font-[800] text-white mb-8 md:mb-10 tracking-tight leading-tight">
            Ready to talk to your documents?
          </h2>
          <Link
            href="/chat"
            className="inline-flex px-8 sm:px-12 py-3.5 sm:py-4.5 rounded-full bg-gradient-to-r from-[#E4FF6E] to-[#B9E62E] text-black text-[15px] md:text-[16px] font-bold group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95"
            style={{ boxShadow: "0 8px 30px rgba(215,255,63,0.3), 0 0 0 1px rgba(215,255,63,0.15)" }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Open ScholarAI <span className="group-hover:translate-x-1.5 transition-transform duration-300">→</span>
            </span>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-[32px] md:py-[40px] px-4 sm:px-6 md:px-12 bg-[#0A0A0C] flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-1">
          <span className="font-[family-name:var(--font-syne)] text-[16px] md:text-[18px] font-bold text-white">Scholar</span>
          <span className="font-[family-name:var(--font-syne)] text-[16px] md:text-[18px] font-bold text-lime-400">AI</span>
        </div>
        <div className="text-[12px] md:text-[13px] font-medium text-gray-500 text-center tracking-wide">
          Built with Mistral AI · Pinecone · Next.js
        </div>
        <div className="text-[12px] md:text-[13px] font-medium text-gray-500 tracking-wide">
          © 2026
        </div>
      </footer>

    </main>
  );
}