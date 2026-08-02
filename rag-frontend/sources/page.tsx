"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { IconSearch, IconFile, IconPlus, IconUploadCloud } from "@/components/icons";
import { ACCENT_GRADIENT } from "@/lib/theme";
import { listSources, uploadFile, SourceRow } from "@/lib/api";
import { useRef } from "react";

const FILTERS: { id: "all" | "pdf" | "link" | "text"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pdf", label: "PDFs" },
  { id: "link", label: "Links" },
  { id: "text", label: "Text" },
];

export default function LibraryPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pdf" | "link" | "text">("all");
  const [query, setQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      setSources(await listSources());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // Every row the backend can actually give us right now is a PDF —
  // /api/upload doesn't accept links or plain text yet (see Sources page).
  // The Links/Text tabs are left in place for when that lands, rather than
  // removed, so nothing has to be rebuilt later — they'll just always be
  // empty until then.
  const visible = useMemo(() => {
    if (filter === "link" || filter === "text") return [];
    return sources.filter((s) => s.filename.toLowerCase().includes(query.trim().toLowerCase()));
  }, [sources, filter, query]);

  const handleAddFiles = async (files: FileList | null) => {
    if (!files) return;
    await Promise.all(Array.from(files).map((f) => uploadFile(f)));
    await refresh();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Deep-links into chat with a new session already scoped to this file,
  // using the backend's existing "mentions a filename" detection in
  // get_filter_for_query — no backend change needed for this to work.
  const askAbout = (filename: string) => {
    router.push(`/chat?file=${encodeURIComponent(filename)}`);
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#0A0A0C] text-gray-100 antialiased relative">
      <Sidebar active="library" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        <div className="px-5 sm:px-10 py-8 max-w-6xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[26px] sm:text-[30px] font-bold text-white tracking-tight mb-1.5">My Library</h1>
              <p className="text-[14px] text-gray-400">Manage and chat with your uploaded knowledge assets.</p>
            </div>
            <div className="relative w-full sm:w-72 shrink-0">
              <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your materials..."
                className="w-full bg-zinc-900/70 border border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-[13px] text-gray-200 placeholder:text-gray-600 outline-none focus:border-lime-400/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-7">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors ${
                  filter === f.id ? "bg-lime-400 text-black" : "text-gray-400 hover:text-gray-200 hover:bg-zinc-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading && <p className="text-[13.5px] text-gray-500 py-10 text-center">Loading your library…</p>}

          {!loading && (filter === "link" || filter === "text") && (
            <p className="text-[13.5px] text-gray-500 italic py-10 text-center border border-dashed border-zinc-800 rounded-2xl">
              {filter === "link" ? "Links" : "Text notes"} aren't supported yet — only PDF uploads are wired up on the backend right now.
            </p>
          )}

          {!loading && filter !== "link" && filter !== "text" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.map((m) => (
                <div key={m.id} className="rounded-3xl border border-zinc-800 bg-zinc-900/50 overflow-hidden flex flex-col group">
                  <div className="h-28 bg-gradient-to-br from-violet-500/15 to-zinc-900 flex items-center justify-center relative">
                    <IconFile width={30} height={30} className="text-white/25" />
                  </div>
                  <div className="p-4 flex flex-col gap-2.5 flex-1">
                    <div>
                      <p className="text-[14px] font-bold text-lime-300 leading-snug line-clamp-2 m-0">{m.filename}</p>
                      <p className="text-[10.5px] font-semibold text-gray-500 tracking-wide mt-1.5 m-0">
                        PDF • {m.chunk_count} chunks indexed
                      </p>
                    </div>
                    <button
                      onClick={() => askAbout(m.filename)}
                      className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-200 text-[12.5px] font-semibold transition-colors"
                    >
                      <IconFile width={14} height={14} />
                      Ask AI
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-3xl border border-dashed border-zinc-700 hover:border-lime-400/40 flex flex-col items-center justify-center text-center p-8 min-h-[220px] transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center mb-3.5">
                  <IconPlus width={18} height={18} className="text-gray-300" />
                </div>
                <p className="text-[13px] font-semibold text-gray-200 mb-1">Add Material</p>
                <p className="text-[12px] text-gray-500 leading-relaxed max-w-[180px]">Upload a PDF to start studying</p>
              </button>

              {!loading && visible.length === 0 && (
                <p className="col-span-full text-[13.5px] text-gray-500 italic py-6 text-center">
                  {query ? "No materials match your search." : "Your library is empty — add a PDF to get started."}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload material"
          className="fixed bottom-7 right-7 w-14 h-14 rounded-full flex items-center justify-center text-black shadow-[0_10px_28px_rgba(215,255,63,0.35)] hover:scale-105 active:scale-95 transition-transform"
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