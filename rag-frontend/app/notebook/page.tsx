// FILE: app/notebook/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { IconNotepad } from "@/components/icons";

export default function NotebookPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-white text-gray-900 antialiased">
      <Sidebar active="library" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0">
        <TopBar mode="global" activeTab="notebook" onOpenSidebar={() => setIsSidebarOpen(true)} />

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-5">
            <IconNotepad width={26} height={26} className="text-gray-500" />
          </div>
          <h1 className="text-[20px] font-bold text-gray-900 mb-2">Notebook isn't built yet</h1>
          <p className="text-[14px] text-gray-500 max-w-sm leading-relaxed mb-6">
            This route exists so the tab doesn't 404, but there's no backend
            behind it — no table to save notes to, no endpoint to fetch them
            from. Say the word and it's a straightforward add next to the
            sessions table already in <code className="text-gray-500">database.py</code>.
          </p>
          <Link href="/chat" className="text-[13px] font-semibold text-violet-500 hover:text-violet-600 transition-colors">
            Back to Chat →
          </Link>
        </div>
      </main>
    </div>
  );
}