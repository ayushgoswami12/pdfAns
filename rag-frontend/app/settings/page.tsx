"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { IconSettings } from "@/components/icons";

export default function SettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#0A0A0C] text-gray-100 antialiased">
      <Sidebar active="settings" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
          <IconSettings width={26} height={26} className="text-gray-500" />
        </div>
        <h1 className="text-[20px] font-bold text-white mb-2">Settings isn't built yet</h1>
        <p className="text-[14px] text-gray-500 max-w-sm leading-relaxed mb-6">
          There's no user/preferences model in the backend yet — nothing to
          toggle here would actually persist. This is a placeholder so the
          sidebar link doesn't 404.
        </p>
        <Link href="/chat" className="text-[13px] font-semibold text-lime-400 hover:text-lime-300 transition-colors">
          Back to Chat →
        </Link>
      </main>
    </div>
  );
}