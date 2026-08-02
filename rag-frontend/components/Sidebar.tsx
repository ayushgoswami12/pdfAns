"use client";

import Link from "next/link";
import {
  IconDiamond,
  IconPlus,
  IconFile,
  IconMessage,
  IconSettings,
  IconClose,
  IconHelp,
} from "./icons";
import { ACCENT_GRADIENT, PANEL_BTN } from "@/lib/theme";

export interface HistoryItem {
  id: string | number;
  title: string;
}

interface SidebarProps {
  /** Which top-level nav item is highlighted. The Sources view lives under
   *  "Library" in these mockups — there's no separate sidebar entry for it. */
  active: "new-chat" | "library" | "settings";
  /** Only the Chat page mockup shows a "Recent History" list — Sources and
   *  Library leave it out. Pass true to render it. */
  showRecentHistory?: boolean;
  historyItems?: HistoryItem[];
  activeHistoryId?: string | number | null;
  onSelectHistory?: (id: string | number) => void;
  /** When on the chat page itself, clicking "New Chat" needs to reset
   *  local state directly — navigating to /chat is a no-op if you're
   *  already there, and even from elsewhere it would just have the
   *  session-restore effect on the chat page immediately reload the
   *  last conversation from localStorage, undoing "new chat" instantly.
   *  Pass this from the chat page; other pages can leave it out and
   *  just navigate + rely on the localStorage clear below. */
  onNewChat?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

// Must match the key used in app/chat/page.tsx's session-restore effect.
const LAST_SESSION_KEY = "scholarai:lastSessionId";

/**
 * NOTE on the footer: the Sources and Library screenshots show a
 * name/plan chip ("Alex Scholar" / "User Profile · Free Plan"), while the
 * Chat screenshot swaps that for a "Help Center" link instead. Rather than
 * have the footer change shape page-to-page, this merges both — profile
 * chip on top, Help Center underneath — consistently everywhere. Flag it
 * if you'd rather match each screenshot exactly.
 */
export default function Sidebar({
  active,
  showRecentHistory = false,
  historyItems = [],
  onNewChat,
  activeHistoryId = null,
  onSelectHistory,
  isOpen = false,
  onClose,
}: SidebarProps) {
  return (
    <aside
      className={`fixed md:relative top-0 left-0 h-full z-50 w-[85%] max-w-[280px] md:max-w-none md:w-[264px] flex flex-col shrink-0 px-5 py-7 bg-white/95 backdrop-blur-xl border-r border-gray-200/80 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex items-center justify-between mb-9 pl-1">
        <div className="flex flex-col leading-tight select-none">
          <span className="font-brand text-[17px] font-bold tracking-wide text-violet-600">ScholarAI</span>
          <span className="text-[10px] font-semibold text-gray-500 tracking-[0.12em] uppercase mt-0.5">
            Advanced Scholar
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center"
          >
            <IconClose />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1 mb-7">
        <Link
          href="/chat"
          onClick={() => {
            if (typeof window !== "undefined") localStorage.removeItem(LAST_SESSION_KEY);
            onNewChat?.();
          }}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors ${
            active === "new-chat" ? "bg-violet-500/15 text-violet-600" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          <IconPlus width={16} height={16} />
          New Chat
        </Link>
        <Link
          href="/library"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors ${
            active === "library" ? "bg-violet-500/15 text-violet-600" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          <IconFile width={16} height={16} />
          Library
        </Link>
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors ${
            active === "settings" ? "bg-violet-500/15 text-violet-600" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          <IconSettings width={16} height={16} />
          Settings
        </Link>
      </nav>

      {showRecentHistory && (
        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1">
          <p className="text-[10.5px] font-bold tracking-[0.12em] uppercase mb-2.5 text-gray-500 pl-2.5">
            Recent History
          </p>
          <div className="space-y-1">
            {historyItems.map((item) => {
              const isActive = activeHistoryId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectHistory?.(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-colors ${
                    isActive ? "bg-violet-500/15 text-violet-600" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <IconMessage width={14} height={14} className="shrink-0" />
                  <span className="truncate text-[13.5px] font-medium">{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!showRecentHistory && <div className="flex-1" />}

      <div className="mt-6 flex flex-col gap-3">
        <button
          className="w-full py-3 rounded-xl text-white text-[13.5px] font-bold shadow-[0_6px_16px_rgba(124,92,252,0.25)] hover:shadow-[0_8px_20px_rgba(124,92,252,0.4)] transition-shadow"
          style={{ background: ACCENT_GRADIENT }}
        >
          Upgrade to Pro
        </button>

        <div className="flex items-center gap-2.5 px-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
            style={{ background: ACCENT_GRADIENT }}
          >
            AS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-gray-800 truncate m-0">Alex Scholar</p>
            <p className="text-[11px] text-gray-500 m-0">Free Plan</p>
          </div>
        </div>

        <Link
          href="/help"
          className="flex items-center gap-2 px-2 text-[12px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          <IconHelp width={14} height={14} />
          Help Center
        </Link>
      </div>
    </aside>
  );
}