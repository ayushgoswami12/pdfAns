// FILE: components/TopBar.tsx
"use client";

import Link from "next/link";
import { IconDiamond, IconMenu, IconShare, IconBell } from "./icons";
import { ACCENT_GRADIENT } from "@/lib/theme";

type Tab = "sources" | "notebook" | "history";

interface TopBarProps {
  activeTab: Tab;
  mode: "global" | "session";
  sessionTitle?: string;
  sourcesActiveCount?: number;
  onOpenSidebar?: () => void;
}

const TABS: { id: Tab; label: string; href: string }[] = [
  { id: "sources", label: "Sources", href: "/sources" },
  // { id: "notebook", label: "Notebook", href: "/notebook" },
  { id: "history", label: "Current Chat", href: "/chat" },
];

export default function TopBar({ activeTab, mode, sessionTitle, sourcesActiveCount, onOpenSidebar }: TopBarProps) {
  return (
    <header
      className="h-[64px] flex items-center justify-between px-5 sm:px-8 shrink-0 sticky top-0 z-30 border-b border-violet-800/30 shadow-[0_2px_20px_rgba(109,70,234,0.15)]"
      style={{ background: "linear-gradient(90deg, #6D46EA 0%, #7C5CFC 100%)" }}
    >
      <div className="flex items-center gap-5 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="md:hidden w-9 h-9 rounded-lg bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0"
        >
          <IconMenu width={18} height={18} />
        </button>

        {mode === "global" ? (
          <span className="text-[16px] font-bold text-white tracking-tight shrink-0">ScholarAI</span>
        ) : (
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[16px] font-bold text-white tracking-tight truncate">{sessionTitle}</span>
            {typeof sourcesActiveCount === "number" && (
              <span className="hidden sm:inline text-[10.5px] font-semibold tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap bg-white/15 border border-white/25 text-white">
                {sourcesActiveCount} SOURCES ACTIVE
              </span>
            )}
          </div>
        )}

        <nav className="hidden sm:flex items-center gap-5 ml-2">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`text-[13.5px] font-semibold pb-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "text-white border-white"
                  : "text-violet-200 border-transparent hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {mode === "global" ? (
          <button className="hidden sm:flex items-center gap-1.5 px-3.5 h-8 rounded-full text-[12px] font-semibold bg-white text-violet-700 hover:bg-violet-50 transition-colors">
            <IconShare width={13} height={13} />
            Share Session
          </button>
        ) : (
          <button className="w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white/80 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors">
            <IconShare />
          </button>
        )}
        <button className="w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white/80 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors">
          <IconBell />
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white text-violet-700 text-[11px] font-bold shrink-0 ring-2 ring-white/40">
          LS
        </div>
      </div>
    </header>
  );
}