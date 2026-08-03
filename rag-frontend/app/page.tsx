// FILE: app/page.tsx
"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { IconDiamond } from "@/components/icons";

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const [spot, setSpot] = useState({ x: 50, y: 40, active: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSpot({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      active: true,
    });
  };

  return (
    <main className="min-h-screen flex flex-col font-sans overflow-x-hidden bg-gradient-to-b from-[#E3DAFF] via-[#EFEAFF] to-[#F8F6FF] selection:bg-violet-200 selection:text-violet-900">

      {/* NAVBAR */}
      <nav className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[850px] flex items-center justify-between gap-3 px-3 py-2.5 rounded-full bg-[#1C1C1E] text-white shadow-2xl border border-[#2A2A2C]">

        <div className="flex items-center gap-2 pl-3">
          <div className="w-7 h-7 rounded flex items-center justify-center bg-white text-black shrink-0">
            <IconDiamond width={16} height={16} />
          </div>
          <span className="font-sans text-[15px] font-bold tracking-wide whitespace-nowrap">
            ScholarAI
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/chat" className="text-gray-300 hover:text-white text-[13.5px] font-medium transition-colors">Chat</Link>
          <Link href="/library" className="text-gray-300 hover:text-white text-[13.5px] font-medium transition-colors">Library</Link>
          <Link href="/sources" className="text-gray-300 hover:text-white text-[13.5px] font-medium transition-colors">Sources</Link>
        </div>

        <div className="flex items-center gap-5 pr-1">
          <Link href="/login" className="hidden sm:block text-gray-300 hover:text-white text-[13.5px] font-medium transition-colors">
            Login
          </Link>
          <Link
            href="/chat"
            className="px-5 py-2 rounded-full bg-white text-black text-[13.5px] font-bold hover:bg-gray-100 hover:scale-[1.02] active:scale-95 transition-all duration-200 whitespace-nowrap"
          >
            Free Trial
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setSpot((s) => ({ ...s, active: false }))}
        className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden pt-[110px] md:pt-[130px]"
      >

        {/* Cursor spotlight — soft violet glow that eases toward the pointer.
            Opacity fades in/out on enter/leave rather than snapping. */}
        <div
          className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-500 ease-out"
          style={{
            opacity: spot.active ? 1 : 0,
            background: `radial-gradient(600px circle at ${spot.x}% ${spot.y}%, rgba(124,92,252,0.14), transparent 65%)`,
            transition: "opacity 0.5s ease-out, background 0.15s ease-out",
          }}
        />

        {/* Layer 1: Radial Gradient */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 100% 60% at 50% -10%, rgba(124,92,252,0.10) 0%, transparent 70%)" }}
        />

        {/* Layer 2: Subtle Grid Lines — restored to an actually-visible
            opacity; 0.02 (the previous value) is imperceptible on this bg */}
        <div
          className="absolute inset-0 z-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(109,70,234,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(109,70,234,0.5) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 80%)"
          }}
        />

        {/* Layer 3: 3D Floating Orb — restored to a visible-but-soft opacity */}
        <div
          className="absolute z-0 w-[250px] sm:w-[300px] md:w-[400px] h-[250px] sm:h-[300px] md:h-[400px] opacity-[0.18] blur-[40px] md:blur-[60px] pointer-events-none"
          style={{
            top: "calc(50% - 150px)",
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
            background: "conic-gradient(from 180deg, #9C8CFF, #C9BFFF, #6D46EA, #9C8CFF)",
            animation: "float 8s ease-in-out infinite"
          }}
        />

        {/* Layer 4: Smaller Sharp Orb */}
        <div
          className="absolute z-0 w-[100px] md:w-[150px] h-[100px] md:h-[150px] opacity-[0.20] blur-[20px] md:blur-[30px] pointer-events-none"
          style={{
            top: "calc(50% - 80px)",
            background: "radial-gradient(circle, rgba(124,92,252,1), transparent)",
            animation: "pulse-orb 4s ease-in-out infinite"
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 w-full max-w-5xl text-center pb-12 md:pb-0">

          <div
            className="mb-6 md:mb-8 text-[11px] sm:text-[12px] font-bold text-[#6D46EA] tracking-[0.18em] uppercase text-center max-w-[90vw]"
            style={{ animation: "fadeInUp 0.6s ease 0.1s both" }}
          >
            Powered by Mistral AI + Pinecone
          </div>

          <h1
            className="font-sans text-[42px] sm:text-[52px] md:text-[64px] font-bold leading-[1.15] tracking-tight max-w-[900px] px-2 text-[#111111]"
            style={{ animation: "fadeInUp 0.6s ease 0.2s both" }}
          >
            Ask Anything, <br className="hidden sm:block" /> About Your PDFs.
          </h1>

          <p
            className="mt-5 md:mt-6 text-[15px] sm:text-[16px] font-medium text-gray-700 max-w-[90%] sm:max-w-[540px] leading-[1.6]"
            style={{ animation: "fadeInUp 0.6s ease 0.35s both" }}
          >
            Upload any PDF. Ask questions. Get precise answers — streamed in real time from your document, not the internet.
          </p>

          <Link
            href="/chat"
            className="mt-8 md:mt-10 px-8 py-3.5 rounded-full bg-white text-black text-[15px] font-bold shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 group relative overflow-hidden transition-all duration-300 active:scale-95"
            style={{ animation: "fadeInUp 0.6s ease 0.5s both" }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Get Started <span className="group-hover:translate-x-1.5 transition-transform duration-300">→</span>
            </span>
          </Link>
        </div>

        {/* Scroll Indicator */}
        <div className="hidden sm:flex absolute bottom-8 md:bottom-12 flex-col items-center opacity-40 z-10">
          <div className="w-[2px] h-[36px] md:h-[48px] bg-gray-400 rounded-full relative overflow-hidden">
            <div className="w-full h-1/2 bg-[#6D46EA] absolute top-0 rounded-full" style={{ animation: "scrollDot 2s ease-in-out infinite" }} />
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-[80px] md:py-[120px] px-4 sm:px-6 mx-auto max-w-[1200px] w-full relative z-10">

        <div className="text-center mb-3 md:mb-4">
          <span className="text-[11px] md:text-[12px] font-bold text-[#6D46EA] tracking-[0.2em] uppercase">
            How It Works
          </span>
        </div>

        <h2 className="text-center font-sans text-[32px] sm:text-[36px] md:text-[42px] font-bold text-gray-900 mb-10 md:mb-16 tracking-tight px-2">
          Intelligence from your documents
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

          {/* Card 1 */}
          <div className="group relative bg-white/60 backdrop-blur-sm border border-white rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-[40px] overflow-hidden transition-all duration-400 hover:border-violet-500/30 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(124,92,252,0.08)]">
            <div className="absolute top-0 left-6 sm:left-8 md:left-[40px] right-6 sm:right-8 md:right-[40px] h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-400" style={{ background: "linear-gradient(to right, transparent, #7C5CFC, transparent)" }} />
            <div className="w-[48px] md:w-[56px] h-[48px] md:h-[56px] rounded-xl md:rounded-2xl bg-[#E3DAFF] flex items-center justify-center mb-5 md:mb-6 ring-1 ring-violet-500/20 group-hover:bg-[#6D46EA] transition-colors duration-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#6D46EA] group-hover:text-white transition-colors duration-400 md:w-[24px] md:h-[24px]">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h3 className="font-bold text-[18px] md:text-[19px] text-gray-900 mb-2 md:mb-3 tracking-tight">Upload Any PDF</h3>
            <p className="text-[14px] md:text-[15px] text-gray-600 font-medium leading-[1.6]">
              Drop in research papers, textbooks, contracts — any PDF instantly becomes queryable.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-white/60 backdrop-blur-sm border border-white rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-[40px] overflow-hidden transition-all duration-400 hover:border-violet-500/30 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(124,92,252,0.08)]">
            <div className="absolute top-0 left-6 sm:left-8 md:left-[40px] right-6 sm:right-8 md:right-[40px] h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-400" style={{ background: "linear-gradient(to right, transparent, #7C5CFC, transparent)" }} />
            <div className="w-[48px] md:w-[56px] h-[48px] md:h-[56px] rounded-xl md:rounded-2xl bg-[#E3DAFF] flex items-center justify-center mb-5 md:mb-6 ring-1 ring-violet-500/20 group-hover:bg-[#6D46EA] transition-colors duration-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#6D46EA] group-hover:text-white transition-colors duration-400 md:w-[24px] md:h-[24px]">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
            <h3 className="font-bold text-[18px] md:text-[19px] text-gray-900 mb-2 md:mb-3 tracking-tight">Semantic Search</h3>
            <p className="text-[14px] md:text-[15px] text-gray-600 font-medium leading-[1.6]">
              MMR retrieval pulls the most relevant, diverse chunks from your document automatically.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-white/60 backdrop-blur-sm border border-white rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-[40px] overflow-hidden transition-all duration-400 hover:border-violet-500/30 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(124,92,252,0.08)] sm:col-span-2 lg:col-span-1 max-w-[600px] mx-auto lg:max-w-none w-full">
            <div className="absolute top-0 left-6 sm:left-8 md:left-[40px] right-6 sm:right-8 md:right-[40px] h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-400" style={{ background: "linear-gradient(to right, transparent, #7C5CFC, transparent)" }} />
            <div className="w-[48px] md:w-[56px] h-[48px] md:h-[56px] rounded-xl md:rounded-2xl bg-[#E3DAFF] flex items-center justify-center mb-5 md:mb-6 ring-1 ring-violet-500/20 group-hover:bg-[#6D46EA] transition-colors duration-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#6D46EA] group-hover:text-white transition-colors duration-400 md:w-[24px] md:h-[24px]">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h3 className="font-bold text-[18px] md:text-[19px] text-gray-900 mb-2 md:mb-3 tracking-tight">Real-time Streaming</h3>
            <p className="text-[14px] md:text-[15px] text-gray-600 font-medium leading-[1.6]">
              Answers stream token by token from Mistral AI — no waiting, no loading spinner.
            </p>
          </div>

        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section
        className="py-[80px] md:py-[100px] px-4 sm:px-6 text-center border-t border-gray-200/40 relative overflow-hidden"
      >
        <div className="relative z-10">
          <h2 className="font-sans text-[32px] sm:text-[36px] md:text-[48px] font-bold text-gray-900 mb-8 md:mb-10 tracking-tight leading-tight">
            Ready to talk to your documents?
          </h2>
          <Link
            href="/chat"
            className="inline-flex px-8 sm:px-12 py-3.5 sm:py-4.5 rounded-full bg-white text-black text-[15px] md:text-[16px] font-bold shadow-[0_8px_20px_rgba(0,0,0,0.06)] group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              Open ScholarAI <span className="group-hover:translate-x-1.5 transition-transform duration-300">→</span>
            </span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-[32px] md:py-[40px] px-4 sm:px-6 md:px-12 bg-transparent flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 border-t border-gray-200/40">
        <div className="flex items-center gap-1">
          <span className="font-sans text-[16px] md:text-[18px] font-bold text-gray-900">Scholar</span>
          <span className="font-sans text-[16px] md:text-[18px] font-bold text-violet-500">AI</span>
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