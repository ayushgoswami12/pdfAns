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
  userEmail?: string;
  onLogout?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

// Must match the key used in app/chat/page.tsx's session-restore effect.
const LAST_SESSION_KEY = "scholarai:lastSessionId";

const NAV_ACTIVE = "bg-white text-violet-700 font-bold";

// Each item gets its own hover accent (text + background tint + left
// glow) so the list reads as distinct destinations rather than one
// uniform block of white-on-purple that only differs when you're
// already hovering the exact right row.
const NAV_ITEMS = [
  { href: "/chat", key: "new-chat" as const, label: "New Chat", Icon: IconPlus, hover: "hover:text-amber-200 hover:bg-amber-400/10" },
  { href: "/library", key: "library" as const, label: "Library", Icon: IconFile, hover: "hover:text-sky-200 hover:bg-sky-400/10" },
  { href: "/sources", key: "sources" as const, label: "Sources", Icon: IconUpload, hover: "hover:text-emerald-200 hover:bg-emerald-400/10" },
  { href: "/notebook", key: "notebook" as const, label: "Notebook", Icon: IconNotepad, hover: "hover:text-pink-200 hover:bg-pink-400/10" },
  { href: "/settings", key: "settings" as const, label: "Settings", Icon: IconSettings, hover: "hover:text-orange-200 hover:bg-orange-400/10" },
];

export default function Sidebar({
  active,
  showRecentHistory = false,
  historyItems = [],
  onNewChat,
  activeHistoryId = null,
  onSelectHistory,
  onDeleteHistory,
  userEmail,
  onLogout,
  isOpen = false,
  onClose,
}: SidebarProps) {
  return (
    <aside
      className={`fixed md:relative top-0 left-0 h-full z-50 w-[85%] max-w-[280px] md:max-w-none md:w-[264px] flex flex-col shrink-0 px-5 py-7 backdrop-blur-xl border-r border-violet-800/30 shadow-[4px_0_24px_rgba(109,70,234,0.15)] transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
      style={{ background: "linear-gradient(180deg, #6D46EA 0%, #5B37D6 100%)" }}
    >
      <div className="flex items-center justify-between mb-9 pl-1">
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0">
            <IconDiamond width={16} height={16} className="text-violet-600" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-brand text-[15px] font-bold tracking-wide text-white">ScholarAI</span>
            <span className="text-[9.5px] font-semibold text-violet-200 tracking-[0.12em] uppercase mt-0.5">
              Advanced Scholar
            </span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 rounded-lg bg-white/10 border border-white/20 text-white/80 hover:text-white flex items-center justify-center"
          >
            <IconClose />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1 mb-7">
        {NAV_ITEMS.map(({ href, key, label, Icon, hover }) => {
          const isActive = active === key;
          return (
            <Link
              key={key}
              href={href}
              onClick={
                key === "new-chat"
                  ? () => {
                      if (typeof window !== "undefined") localStorage.removeItem(LAST_SESSION_KEY);
                      onNewChat?.();
                    }
                  : undefined
              }
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors duration-150 ${
                isActive ? NAV_ACTIVE : `text-violet-200 ${hover}`
              }`}
            >
              <Icon width={16} height={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {showRecentHistory && (
        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1">
          <p className="text-[10.5px] font-bold tracking-[0.12em] uppercase mb-2.5 text-violet-200 pl-2.5">
            Recent History
          </p>
          <div className="space-y-1">
            {historyItems.map((item) => {
              const isActive = activeHistoryId === item.id;
              return (
                <div key={item.id} className="group relative">
                  <button
                    onClick={() => onSelectHistory?.(item.id)}
                    className={`w-full flex items-center gap-2.5 pl-3.5 pr-9 py-2.5 rounded-xl text-left transition-colors duration-150 ${
                      isActive ? NAV_ACTIVE : "text-violet-200 hover:text-violet-100 hover:bg-white/10"
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
                      className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                        isActive ? "text-violet-400 hover:text-red-500 hover:bg-red-50" : "text-violet-300 hover:text-red-200 hover:bg-white/10"
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
        <button className="w-full py-3 rounded-xl bg-white text-violet-700 text-[13.5px] font-bold shadow-[0_6px_16px_rgba(0,0,0,0.15)] hover:bg-violet-50 transition-colors">
          Upgrade to Pro
        </button>

        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-violet-700 text-[11px] font-bold shrink-0">
            {userEmail ? userEmail.slice(0, 2).toUpperCase() : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-white truncate m-0">{userEmail || "Not signed in"}</p>
            <p className="text-[11px] text-violet-200 m-0">Free Plan</p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              aria-label="Log out"
              className="shrink-0 text-[11px] font-semibold text-violet-200 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              Log out
            </button>
          )}
        </div>

        <Link
          href="/help"
          className="flex items-center gap-2 px-2 text-[12px] font-medium text-violet-200 hover:text-white transition-colors"
        >
          <IconHelp width={14} height={14} />
          Help Center
        </Link>
      </div>
    </aside>
  );
}