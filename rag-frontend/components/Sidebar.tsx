// FILE: components/Sidebar.tsx
"use client";

import Link from "next/link";
import {
  IconDiamond,
  IconPlus,
  IconFile,
  IconUpload,
  IconNotepad,
  IconMessage,
  IconSettings,
  IconClose,
  IconHelp,
  IconTrash,
} from "./icons";

export interface HistoryItem {
  id: string | number;
  title: string;
}

interface SidebarProps {
  active: "new-chat" | "library" | "sources" | "notebook" | "settings";
  showRecentHistory?: boolean;
  historyItems?: HistoryItem[];
  activeHistoryId?: string | number | null;
  onSelectHistory?: (id: string | number) => void;
  onDeleteHistory?: (id: string | number) => void;
  onNewChat?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

// Must match the key used in app/chat/page.tsx's session-restore effect.
const LAST_SESSION_KEY = "scholarai:lastSessionId";

// Light theme: Inactive is cool gray, hover is soft purple, Active is bold violet
const NAV_LINK =
  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200";
const NAV_ACTIVE = "bg-violet-500/10 text-violet-700 font-bold";
const NAV_INACTIVE = "text-gray-500 hover:text-violet-700 hover:bg-violet-50";

export default function Sidebar({
  active,
  showRecentHistory = false,
  historyItems = [],
  onNewChat,
  activeHistoryId = null,
  onSelectHistory,
  onDeleteHistory,
  isOpen = false,
  onClose,
}: SidebarProps) {
  return (
    <aside
      className={`fixed md:relative top-0 left-0 h-full z-50 w-[85%] max-w-[280px] md:max-w-none md:w-[264px] flex flex-col shrink-0 px-5 py-7 bg-white/90 backdrop-blur-xl border-r border-violet-100 shadow-[4px_0_24px_rgba(109,70,234,0.06)] transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex items-center justify-between mb-9 pl-1">
        <Link href="/" className="flex items-center gap-2.5 select-none hover:opacity-70 transition-opacity">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <IconDiamond width={16} height={16} className="text-violet-600" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-brand text-[15px] font-bold tracking-wide text-gray-900">ScholarAI</span>
            <span className="text-[9.5px] font-bold text-violet-400 tracking-[0.12em] uppercase mt-0.5">
              Advanced Scholar
            </span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-violet-600 flex items-center justify-center transition-colors"
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
          className={`${NAV_LINK} ${active === "new-chat" ? NAV_ACTIVE : NAV_INACTIVE}`}
        >
          <IconPlus width={16} height={16} />
          New Chat
        </Link>
        <Link href="/library" className={`${NAV_LINK} ${active === "library" ? NAV_ACTIVE : NAV_INACTIVE}`}>
          <IconFile width={16} height={16} />
          Library
        </Link>
        <Link href="/sources" className={`${NAV_LINK} ${active === "sources" ? NAV_ACTIVE : NAV_INACTIVE}`}>
          <IconUpload width={16} height={16} />
          Sources
        </Link>
        <Link href="/notebook" className={`${NAV_LINK} ${active === "notebook" ? NAV_ACTIVE : NAV_INACTIVE}`}>
          <IconNotepad width={16} height={16} />
          Notebook
        </Link>
        <Link href="/settings" className={`${NAV_LINK} ${active === "settings" ? NAV_ACTIVE : NAV_INACTIVE}`}>
          <IconSettings width={16} height={16} />
          Settings
        </Link>
      </nav>

      {showRecentHistory && (
        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1">
          <p className="text-[10.5px] font-bold tracking-[0.12em] uppercase mb-2.5 text-gray-400 pl-2.5">
            Recent History
          </p>
          <div className="space-y-1">
            {historyItems.map((item) => {
              const isActive = activeHistoryId === item.id;
              return (
                <div key={item.id} className="group relative">
                  <button
                    onClick={() => onSelectHistory?.(item.id)}
                    className={`w-full flex items-center gap-2.5 pl-3.5 pr-9 py-2.5 rounded-xl text-left transition-all duration-200 ${
                      isActive ? NAV_ACTIVE : NAV_INACTIVE
                    }`}
                  >
                    <IconMessage width={14} height={14} className="shrink-0" />
                    <span className="truncate text-[13.5px] font-medium">{item.title}</span>
                  </button>
                  {onDeleteHistory && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHistory(item.id);
                      }}
                      aria-label={`Delete "${item.title}"`}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                        isActive ? "text-violet-500 hover:text-red-500 hover:bg-red-50" : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                      }`}
                    >
                      <IconTrash width={13} height={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {!showRecentHistory && <div className="flex-1" />}

      <div className="mt-6 flex flex-col gap-3">
        <button className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-[13.5px] font-bold shadow-[0_4px_14px_rgba(109,70,234,0.25)] hover:shadow-[0_6px_20px_rgba(109,70,234,0.4)] hover:-translate-y-0.5 transition-all duration-200">
          Upgrade to Pro
        </button>
        <div className="flex items-center gap-2.5 px-1 mt-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-violet-100 text-violet-700 text-[11px] font-bold shrink-0">
            AS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-gray-900 truncate m-0">LDRP STUDENT</p>
            <p className="text-[11px] text-gray-500 m-0">Free Plan</p>
          </div>
        </div>
        <Link
          href="/help"
          className="flex items-center gap-2 px-2 pt-2 text-[12px] font-medium text-gray-400 hover:text-violet-600 transition-colors"
        >
          <IconHelp width={14} height={14} />
          Help Center
        </Link>
      </div>
    </aside>
  );
}