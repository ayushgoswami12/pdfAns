"use client";

import Link from "next/link";
import { IconDiamond, IconMenu, IconShare, IconBell } from "./icons";
import { ACCENT_GRADIENT, LAVENDER_CHIP, NEUTRAL_BADGE } from "@/lib/theme";

type Tab = "sources" | "notebook" | "history";

interface TopBarProps {
  activeTab: Tab;
  /** "global": plain ScholarAI wordmark + full "Share Session" pill — used
   *  on the Sources page. "session": a chat title + active-sources badge
   *  replaces the wordmark, and Share collapses to an icon — used on the
   *  Chat page. (Kept the tab order — Sources / Notebook / History — the
   *  same in both places; the two screenshots show it in a different
   *  order, which read as a mockup inconsistency rather than intentional.) */
  mode: "global" | "session";
  sessionTitle?: string;
  sourcesActiveCount?: number;
  onOpenSidebar?: () => void;
}

const TABS: { id: Tab; label: string; href: string }[] = [
  { id: "sources", label: "Sources", href: "/sources" },
  { id: "notebook", label: "Notebook", href: "/notebook" },
  { id: "history", label: "Current Chat", href: "/chat" },
];

export default function TopBar({ activeTab, mode, sessionTitle, sourcesActiveCount, onOpenSidebar }: TopBarProps) {
  return (
    <header className="h-[64px] flex items-center justify-between px-5 sm:px-8 shrink-0 sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-gray-200/60">
      <div className="flex items-center gap-5 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="md:hidden w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 flex items-center justify-center shrink-0"
        >
          <IconMenu width={18} height={18} />
        </button>

        {mode === "global" ? (
          <span className="text-[16px] font-bold text-gray-900 tracking-tight shrink-0">ScholarAI</span>
        ) : (
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[16px] font-bold text-gray-900 tracking-tight truncate">{sessionTitle}</span>
            {typeof sourcesActiveCount === "number" && (
              <span className={`hidden sm:inline text-[10.5px] font-semibold tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${NEUTRAL_BADGE}`}>
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
                  ? "text-violet-600 border-violet-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {mode === "global" ? (
          <button className={`hidden sm:flex items-center gap-1.5 px-3.5 h-8 rounded-full text-[12px] font-semibold transition-colors ${LAVENDER_CHIP}`}>
            <IconShare width={13} height={13} />
            Share Session
          </button>
        ) : (
          <button className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:text-violet-600 flex items-center justify-center transition-colors">
            <IconShare />
          </button>
        )}
        <button className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:text-violet-600 flex items-center justify-center transition-colors">
          <IconBell />
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
          style={{ background: ACCENT_GRADIENT }}
        >
          AS
        </div>
      </div>
    </header>
  );
}