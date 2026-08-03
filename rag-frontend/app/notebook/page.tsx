// FILE: app/notebook/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { IconNotepad } from "@/components/icons";
import UploadIndicatorStack, { UploadJob } from "@/components/UploadIndicator";

const DEMO_FILENAME = "lecture-notes-week4.pdf";

export default function NotebookPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [demoJob, setDemoJob] = useState<UploadJob>({
    id: "demo",
    filename: DEMO_FILENAME,
    progress: 0,
    status: "uploading",
  });

  useEffect(() => {
    document.title = "Notebook · ScholarAI";
  }, []);

  // Self-running demo loop so the animation is visible on load without
  // needing a real file — clearly labeled below as a preview, not a
  // working upload (there's no backend route behind this page yet).
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setDemoJob({ id: "demo", filename: DEMO_FILENAME, progress: 0, status: "uploading" });
      for (let pct = 0; pct <= 100; pct += 4) {
        if (cancelled) return;
        setDemoJob((j) => ({ ...j, progress: pct }));
        await new Promise((r) => setTimeout(r, 60));
      }
      if (cancelled) return;
      setDemoJob((j) => ({ ...j, status: "success", progress: 100 }));
      await new Promise((r) => setTimeout(r, 2200));
      if (!cancelled) run();
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

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

          <div className="w-full max-w-md mb-2">
            <p className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-violet-400 mb-3">
              Preview — animation only, not a working upload
            </p>
            <UploadIndicatorStack jobs={[demoJob]} />
          </div>

          <Link href="/chat" className="text-[13px] font-semibold text-violet-500 hover:text-violet-600 transition-colors mt-6">
            Back to Chat →
          </Link>
        </div>
      </main>
    </div>
  );
}