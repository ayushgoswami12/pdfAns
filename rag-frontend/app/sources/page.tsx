// FILE: app/sources/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { IconUpload, IconFile, IconGlobe, IconNotepad, IconWipe } from "@/components/icons";
import { ACCENT_GRADIENT, LAVENDER_CHIP, NEUTRAL_BADGE, CARD } from "@/lib/theme";
import { listSources, deleteSource, uploadFile, SourceRow } from "@/lib/api";

function formatFileSize(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface UploadingJob {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "error";
  errorMessage?: string;
}

export default function SourcesPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadingJobs, setUploadingJobs] = useState<UploadingJob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Sources · ScholarAI";
  }, []);

  const refresh = async () => {
    try {
      setLoadError(null);
      const rows = await listSources();
      setSources(rows);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load sources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    await Promise.all(
      Array.from(files).map(async (file) => {
        const jobId = Math.random().toString(36).slice(2, 9);
        setUploadingJobs((prev) => [...prev, { id: jobId, name: file.name, progress: 0, status: "uploading" }]);
        try {
          await uploadFile(file, (pct) =>
            setUploadingJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, progress: pct } : j)))
          );
          setUploadingJobs((prev) => prev.filter((j) => j.id !== jobId));
          await refresh();
        } catch (e) {
          setUploadingJobs((prev) =>
            prev.map((j) =>
              j.id === jobId
                ? { ...j, status: "error", errorMessage: e instanceof Error ? e.message : "Upload failed" }
                : j
            )
          );
        }
      })
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (filename: string) => {
    const previous = sources;
    setSources((prev) => prev.filter((s) => s.filename !== filename));
    try {
      await deleteSource(filename);
    } catch {
      setSources(previous);
    }
  };

  const handleWipeAll = async () => {
    const previous = sources;
    setSources([]);
    try {
      await Promise.all(previous.map((s) => deleteSource(s.filename)));
    } catch {
      await refresh();
    }
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-white text-gray-900 antialiased">
      <Sidebar active="library" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0">
        <TopBar mode="global" activeTab="sources" onOpenSidebar={() => setIsSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 sm:px-10 py-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-[26px] sm:text-[30px] font-bold text-violet-600 tracking-tight mb-2">Knowledge Sources</h1>
            <p className="text-[14.5px] text-gray-500 mb-8">
              Power up your ScholarAI by providing context through documents, URLs, or notes.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5 mb-10">
              {/* Upload Documents — the only ingestion path the backend actually supports right now */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`${CARD} flex flex-col items-center justify-center text-center px-8 py-10 hover:border-gray-300 hover:bg-gray-50 transition-colors`}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#E7E4FF]/15 flex items-center justify-center mb-4">
                  <IconUpload width={24} height={24} className="text-[#B4ADFF]" />
                </div>
                <p className="text-[16px] font-bold text-gray-900 mb-1.5">Upload Documents</p>
                <p className="text-[13px] text-gray-500 max-w-[220px] leading-relaxed">
                  Drop a PDF here to begin analysis.
                </p>
              </button>

              <div className="flex flex-col gap-5">
                {/* Web Context — UI only. /api/upload only accepts PDFs today,
                    so this is disabled rather than pretending to work. */}
                <div className={`${CARD} p-5 opacity-50`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-5 h-5 rounded-full bg-sky-500/15 flex items-center justify-center text-sky-400">
                      <IconGlobe />
                    </span>
                    <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-sky-400">Web Context</span>
                    <span className="text-[10px] font-semibold text-gray-500 ml-auto">Coming soon</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      disabled
                      placeholder="Paste URL (e.g. Wikipedia)"
                      className="flex-1 min-w-0 bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-500 placeholder:text-gray-400 outline-none cursor-not-allowed"
                    />
                    <button disabled className="shrink-0 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-500 text-[13px] font-bold cursor-not-allowed">
                      Add
                    </button>
                  </div>
                </div>

                {/* Quick Notes — same story, no backend route to save these yet. */}
                <div className={`${CARD} p-5 flex-1 flex flex-col opacity-50`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-5 h-5 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-400">
                      <IconNotepad />
                    </span>
                    <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-rose-400">Quick Notes</span>
                    <span className="text-[10px] font-semibold text-gray-500 ml-auto">Coming soon</span>
                  </div>
                  <textarea
                    disabled
                    placeholder="Paste your study notes or relevant excerpts here..."
                    rows={3}
                    className="w-full flex-1 resize-none bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-3 text-[13px] text-gray-500 placeholder:text-gray-400 outline-none cursor-not-allowed mb-3"
                  />
                  <button disabled className="self-end px-4 py-2 rounded-xl border border-gray-200 text-gray-500 text-[12.5px] font-semibold cursor-not-allowed">
                    Import
                  </button>
                </div>
              </div>
            </div>

            {/* Active Repository */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-[16px] font-bold text-gray-900">Active Repository</h2>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${LAVENDER_CHIP}`}>
                  {sources.length} {sources.length === 1 ? "ITEM" : "ITEMS"}
                </span>
              </div>
              {sources.length > 0 && (
                <button
                  onClick={handleWipeAll}
                  className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-500 hover:text-red-400 transition-colors"
                >
                  <IconWipe />
                  Wipe All
                </button>
              )}
            </div>

            {uploadingJobs.length > 0 && (
              <div className="space-y-2 mb-3">
                {uploadingJobs.map((job) => (
                  <div key={job.id} className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-gray-50/60 border border-gray-200/80">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-700">
                      <IconFile width={16} height={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium text-gray-900 truncate m-0">{job.name}</p>
                      <p className="text-[11.5px] text-gray-500 truncate m-0 mt-0.5">
                        {job.status === "error" ? job.errorMessage : "Uploading & indexing…"}
                      </p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full ${job.status === "error" ? "bg-red-500/10 border border-red-500/30 text-red-400" : NEUTRAL_BADGE}`}>
                      {job.status === "error" ? "FAILED" : `${job.progress}%`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {loading && <p className="text-[13.5px] text-gray-500 py-6 text-center">Loading sources…</p>}
              {loadError && !loading && (
                <p className="text-[13.5px] text-red-400 py-6 text-center">{loadError}</p>
              )}
              {!loading && !loadError && sources.length === 0 && uploadingJobs.length === 0 && (
                <p className="text-[13.5px] text-gray-500 italic py-6 text-center border border-dashed border-gray-200 rounded-2xl">
                  No sources yet — upload a PDF above to get started.
                </p>
              )}
              {sources.map((item) => (
                <div key={item.id} className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-gray-50/60 border border-gray-200/80">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-700">
                    <IconFile width={16} height={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium text-gray-900 truncate m-0">{item.filename}</p>
                    <p className="text-[11.5px] text-gray-500 truncate m-0 mt-0.5">
                      PDF Document • {formatFileSize(item.size_bytes)} • Uploaded {timeAgo(item.uploaded_at)}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full ${NEUTRAL_BADGE}`}>
                    PROCESSED
                  </span>
                  <button
                    onClick={() => handleDelete(item.filename)}
                    className="shrink-0 text-[11.5px] font-semibold text-gray-500 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf"
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
    </div>
  );
}