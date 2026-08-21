"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import { logout } from "@/lib/auth";
import { IconHelp } from "@/components/icons";

export default function HelpPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      {(user) => (
        <div className="flex h-[100dvh] w-full overflow-hidden bg-white text-gray-900 antialiased">
          <Sidebar
            active="library"
            userEmail={user.email}
            onLogout={() => { logout(); router.push("/login"); }}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-5">
              <IconHelp width={26} height={26} className="text-gray-500" />
            </div>
            <h1 className="text-[20px] font-bold text-gray-900 mb-2">Help Center isn't built yet</h1>
            <p className="text-[14px] text-gray-500 max-w-sm leading-relaxed mb-6">
              Placeholder so the link doesn't 404. Drop FAQ content here whenever
              you're ready.
            </p>
            <Link href="/chat" className="text-[13px] font-semibold text-violet-500 hover:text-violet-600 transition-colors">
              Back to Chat →
            </Link>
          </main>
        </div>
      )}
    </AuthGuard>
  );
}