// FILE: app/library/page.tsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import UploadIndicatorStack from "@/components/UploadIndicator"; // Imported the indicator
import { IconSearch, IconFile, IconPlus, IconUploadCloud, IconTrash } from "@/components/icons";
import { ACCENT_GRADIENT } from "@/lib/theme";
import { listSources, uploadFile, deleteSource, SourceRow } from "@/lib/api";

const FILTERS: { id: "all" | "pdf" | "link" | "text"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pdf", label: "PDFs" },
  { id: "link", label: "Links" },
  { id: "text", label: "Text" },
];

// Interface matching the expected props for the UploadIndicator
export interface UploadJob {
  id: string;
  filename: string;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  error?: string;
}

export default function LibraryPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pdf" | "link" | "text">("all");
  const [query, setQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state to track active upload jobs
  const [uploadJobs, setUploadJobs] = useState<UploadJob[]>([]);

  useEffect(() => {
    document.title = "Library · ScholarAI";
  }, []);

  const refresh = async () => {
    try {
      setLoadError(null);
      const rows = await listSources();
      setSources(rows);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load your library.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const visible = useMemo(() => {
    if (filter === "link" || filter === "text") return [];
    return sources.filter((s) => s.filename.toLowerCase().includes(query.trim().toLowerCase()));
  }, [sources, filter, query]);

  const handleAddFiles = async (files: FileList | null) => {
    if (!files) return;

    // Create initial job states for the UI
    const newJobs: UploadJob[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).substring(7),
      filename: f.name,
      progress: 0,
      status: "uploading",
    }));

    setUploadJobs((prev) => [...prev, ...newJobs]);

    // Simulate progress visually while waiting for the actual upload promise to resolve
    const intervals = newJobs.map((job) => {
      return setInterval(() => {
        setUploadJobs((prev) =>
          prev.map((p) => {
            if (p.id === job.id && p.status === "uploading" && p.progress < 90) {
              // Increment progress randomly between 5% and 15%
              return { ...p, progress: Math.min(p.progress + Math.floor(Math.random() * 10) + 5, 90) };
            }
            return p;
          })
        );
      }, 400);
    });

    try {
      await Promise.all(
        Array.from(files).map(async (f, index) => {
          const job = newJobs[index];
          try {
            await uploadFile(f);
            clearInterval(intervals[index]);
            // On success, snap to 100% and mark as done
            setUploadJobs((prev) =>
              prev.map((p) => (p.id === job.id ? { ...p, progress: 100, status: "done" } : p))
            );
          } catch (e) {
            clearInterval(intervals[index]);
            // On error, mark status as error and pass message
            setUploadJobs((prev) =>
              prev.map((p) =>
                p.id === job.id ? { ...p, status: "error", error: e instanceof Error ? e.message : "Failed" } : p
              )
            );
          }
        })
      );
      await refresh();
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Clear out completed/errored jobs from the UI after 3 seconds
      setTimeout(() => {
        setUploadJobs((prev) => prev.filter((p) => !newJobs.find((n) => n.id === p.id)));
      }, 3000);
    }
  };

  const askAbout = (filename: string) => {
    router.push(`/chat?file=${encodeURIComponent(filename)}`);
  };

  const handleDelete = async (filename: string) => {
    const previous = sources;
    setSources((prev) => prev.filter((s) => s.filename !== filename));
    try {
      await deleteSource(filename);
    } catch {
      setSources(previous); // roll back if the delete actually failed
    }
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-white text-gray-900 antialiased relative">
      <Sidebar active="library" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        <div className="px-5 sm:px-10 py-8 max-w-6xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[26px] sm:text-[30px] font-bold text-gray-900 tracking-tight mb-1.5">My Library</h1>
              <p className="text-[14px] text-gray-500">Manage and chat with your uploaded knowledge assets.</p>
            </div>
            <div className="relative w-full sm:w-72 shrink-0">
              <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your materials..."
                className="w-full bg-gray-50/80 border border-gray-200 rounded-full pl-10 pr-4 py-2.5 text-[13px] text-gray-800 placeholder:text-gray-400 outline-none focus:border-violet-500/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-7">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors ${
                  filter === f.id ? "bg-violet-500 text-white" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading && <p className="text-[13.5px] text-gray-500 py-10 text-center">Loading your library…</p>}

          {!loading && loadError && (
            <div className="py-10 text-center border border-dashed border-red-900/40 rounded-2xl">
              <p className="text-[13.5px] text-red-400 mb-3">{loadError}</p>
              <button
                onClick={refresh}
                className="text-[12.5px] font-semibold text-violet-500 hover:text-violet-600 transition-colors"
              >
                Try again
              </button>
              <p className="text-[11.5px] text-gray-400 mt-3">
                Most common cause: the backend (<code className="text-gray-500">python server.py</code>) isn't running.
              </p>
            </div>
          )}

          {!loading && !loadError && (filter === "link" || filter === "text") && (
            <p className="text-[13.5px] text-gray-500 italic py-10 text-center border border-dashed border-gray-200 rounded-2xl">
              {filter === "link" ? "Links" : "Text notes"} aren't supported yet — only PDF uploads are wired up on the backend right now.
            </p>
          )}

          {!loading && !loadError && filter !== "link" && filter !== "text" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.map((m) => (
                <div key={m.id} className="rounded-3xl border border-gray-200 bg-gray-50/60 overflow-hidden flex flex-col group">
                  <div className="h-28 bg-gradient-to-br from-violet-500/15 to-gray-100 flex items-center justify-center relative">
                    <IconFile width={30} height={30} className="text-gray-900/25" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(m.filename);
                      }}
                      aria-label={`Remove ${m.filename}`}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur text-gray-500 hover:text-red-500 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <IconTrash width={13} height={13} />
                    </button>
                  </div>
                  <div className="p-4 flex flex-col gap-2.5 flex-1">
                    <div>
                      <p className="text-[14px] font-bold text-violet-600 leading-snug line-clamp-2 m-0">{m.filename}</p>
                      <p className="text-[10.5px] font-semibold text-gray-500 tracking-wide mt-1.5 m-0">
                        PDF • {m.chunk_count} chunks indexed
                      </p>
                    </div>
                    <button
                      onClick={() => askAbout(m.filename)}
                      className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-[12.5px] font-semibold transition-colors"
                    >
                      <IconFile width={14} height={14} />
                      Ask AI
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-3xl border border-dashed border-gray-300 hover:border-violet-500/40 flex flex-col items-center justify-center text-center p-8 min-h-[220px] transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center mb-3.5">
                  <IconPlus width={18} height={18} className="text-gray-700" />
                </div>
                <p className="text-[13px] font-semibold text-gray-800 mb-1">Add Material</p>
                <p className="text-[12px] text-gray-500 leading-relaxed max-w-[180px]">Upload a PDF to start studying</p>
              </button>

              {visible.length === 0 && (
                <p className="col-span-full text-[13.5px] text-gray-500 italic py-6 text-center">
                  {query ? "No materials match your search." : "Your library is empty — add a PDF to get started."}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Upload Indicator Container - Floats in the bottom right corner */}
        <div className="fixed bottom-28 right-7 z-50 flex flex-col gap-2 pointer-events-none">
          <div className="pointer-events-auto">
            <UploadIndicatorStack jobs={uploadJobs} />
          </div>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload material"
          className="fixed bottom-7 right-7 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_10px_28px_rgba(124,92,252,0.35)] hover:scale-105 active:scale-95 transition-transform"
          style={{ background: ACCENT_GRADIENT }}
        >
          <IconUploadCloud width={22} height={22} />
        </button>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf"
        className="hidden"
        onChange={(e) => handleAddFiles(e.target.files)}
      />
    </div>
  );
}