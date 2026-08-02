"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { IconHelp } from "@/components/icons";

export default function HelpPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#0A0A0C] text-gray-100 antialiased">
      <Sidebar active="library" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
          <IconHelp width={26} height={26} className="text-gray-500" />
        </div>
        <h1 className="text-[20px] font-bold text-white mb-2">Help Center isn't built yet</h1>
        <p className="text-[14px] text-gray-500 max-w-sm leading-relaxed mb-6">
          Placeholder so the link doesn't 404. Drop FAQ content here whenever
          you're ready.
        </p>
        <Link href="/chat" className="text-[13px] font-semibold text-lime-400 hover:text-lime-300 transition-colors">
          Back to Chat →
        </Link>
      </main>
    </div>
  );
}