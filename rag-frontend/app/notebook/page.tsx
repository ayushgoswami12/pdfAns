// location : notebook/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import AuthGuard from "@/components/AuthGuard";
import { logout } from "@/lib/auth";

import {
  createNotebookNote,
  deleteNotebookNote,
  listNotebookDocuments,
  listNotebookNotes,
  updateNotebookNote,
  uploadNotebookPdf,
  getNotebookDocumentViewUrl,
  NotebookDocument,
  NotebookNote,
} from "@/lib/api";


type ViewMode = "write" | "preview";
type TimelineItem =
  | { type: "note"; date: string; data: NotebookNote }
  | { type: "pdf"; date: string; data: NotebookDocument };


function Icon({
  name,
  className = "w-4 h-4",
}: {
  name: "book" | "plus" | "upload" | "file" | "eye" | "edit" | "trash" | "clock" | "check" | "spark" | "close";
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "book") {
    return (
      <svg {...common}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
        <path d="M4 5.5v16" />
        <path d="M8 7h8M8 11h8" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "upload") {
    return (
      <svg {...common}>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </svg>
    );
  }

  if (name === "file") {
    return (
      <svg {...common}>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </svg>
    );
  }

  if (name === "eye") {
    return (
      <svg {...common}>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  if (name === "edit") {
    return (
      <svg {...common}>
        <path d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3Z" />
        <path d="m13.5 7.5 3 3" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg {...common}>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (name === "spark") {
    return (
      <svg {...common}>
        <path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" />
        <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}


function formatRelativeTime(value?: string): string {
  if (!value) return "";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "";

  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}


function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}


function renderPreview(text: string) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={index} className="h-2" />;
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={index} className="text-base font-bold text-[#211a3a] mt-5 first:mt-0">
              {trimmed.slice(4)}
            </h3>
          );
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={index} className="text-xl font-bold text-[#211a3a] mt-6 first:mt-0">
              {trimmed.slice(3)}
            </h2>
          );
        }

        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={index} className="text-2xl font-bold text-[#211a3a] mt-6 first:mt-0">
              {trimmed.slice(2)}
            </h1>
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={index} className="flex gap-3 text-[15px] leading-7 text-[#4f4860]">
              <span className="mt-[11px] w-1.5 h-1.5 rounded-full bg-[#b28a4a] shrink-0" />
              <span>{trimmed.slice(2)}</span>
            </div>
          );
        }

        return (
          <p key={index} className="text-[15px] leading-7 text-[#4f4860]">
            {line}
          </p>
        );
      })}
    </div>
  );
}


export default function NotebookPage() {
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notes, setNotes] = useState<NotebookNote[]>([]);
  const [documents, setDocuments] = useState<NotebookDocument[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);

  const [title, setTitle] = useState("Untitled note");
  const [content, setContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("write");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [viewingPdfUrl, setViewingPdfUrl] = useState<string | null>(null);
  const [viewingPdfName, setViewingPdfName] = useState("PDF Viewer");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.title = "Notebook · ScholarAI";
  }, []);


  const loadNotebook = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [noteRows, documentRows] = await Promise.all([
        listNotebookNotes(),
        listNotebookDocuments(),
      ]);

      setNotes(noteRows);
      setDocuments(documentRows);

      if (noteRows.length > 0) {
        const first = noteRows[0];
        setActiveNoteId(first.id);
        setTitle(first.title);
        setContent(first.content);
      } else {
        setActiveNoteId(null);
        setTitle("Untitled note");
        setContent("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Notebook.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotebook();
  }, [loadNotebook]);

  const selectNote = (note: NotebookNote) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setViewMode("write");
    setSaveMessage("");
    setError("");
  };

  const createNewNote = async () => {
    setError("");

    try {
      const note = await createNotebookNote("Untitled note", "");
      setNotes((current) => [note, ...current]);
      setActiveNoteId(note.id);
      setTitle(note.title);
      setContent(note.content);
      setViewMode("write");
      setSaveMessage("New note created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the note.");
    }
  };

  const saveNote = useCallback(async () => {
    if (activeNoteId === null) return;

    setIsSaving(true);
    setSaveMessage("");
    setError("");

    try {
      const updated = await updateNotebookNote(
        activeNoteId,
        title.trim() || "Untitled note",
        content
      );

      setNotes((current) =>
        current
          .map((note) => (note.id === updated.id ? updated : note))
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      );

      setTitle(updated.title);
      setSaveMessage("Saved just now");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the note.");
    } finally {
      setIsSaving(false);
    }
  }, [activeNoteId, title, content]);

  const scheduleSave = () => {
    if (activeNoteId === null) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    setSaveMessage("Unsaved changes");
    saveTimerRef.current = setTimeout(() => {
      saveNote();
    }, 900);
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const beginRename = (note: NotebookNote) => {
    setRenameId(note.id);
    setRenameValue(note.title || "Untitled note");
    setError("");
  };

  const cancelRename = () => {
    setRenameId(null);
    setRenameValue("");
  };

  const saveRename = async () => {
    if (renameId === null) return;

    const note = notes.find((item) => item.id === renameId);
    const trimmed = renameValue.trim();

    if (!note) return;

    if (!trimmed) {
      setError("Note name cannot be empty.");
      return;
    }

    try {
      const updated = await updateNotebookNote(
        note.id,
        trimmed,
        note.content
      );

      setNotes((current) =>
        current
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      );

      if (activeNoteId === note.id) setTitle(updated.title);
      setSaveMessage("Renamed just now");
      setError("");
      cancelRename();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename the note.");
    }
  };

  const handleViewPdf = async (document: NotebookDocument) => {
    setError("");

    try {
      if (viewingPdfUrl) {
        URL.revokeObjectURL(viewingPdfUrl);
      }

      const url = await getNotebookDocumentViewUrl(document.id);
      setViewingPdfName(document.filename);
      setViewingPdfUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the PDF.");
    }
  };

  const closePdfViewer = () => {
    if (viewingPdfUrl) {
      URL.revokeObjectURL(viewingPdfUrl);
    }
    setViewingPdfUrl(null);
  };

  const handleDeleteNote = async () => {
    if (activeNoteId === null) return;

    if (!window.confirm("Delete this note? This cannot be undone.")) return;

    try {
      await deleteNotebookNote(activeNoteId);

      const remaining = notes.filter((note) => note.id !== activeNoteId);
      setNotes(remaining);

      if (remaining.length > 0) {
        selectNote(remaining[0]);
      } else {
        setActiveNoteId(null);
        setTitle("Untitled note");
        setContent("");
      }

      setSaveMessage("Note deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the note.");
    }
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      const document = await uploadNotebookPdf(file, setUploadProgress);
      setDocuments((current) => [document, ...current]);
      setSaveMessage("PDF added just now");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload the PDF.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      event.target.value = "";
    }
  };

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...notes.map((note) => ({
        type: "note" as const,
        date: note.updated_at,
        data: note,
      })),
      ...documents.map((document) => ({
        type: "pdf" as const,
        date: document.uploaded_at,
        data: document,
      })),
    ];

    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [notes, documents]);

  const activeNote = notes.find((note) => note.id === activeNoteId);

  return (
    <AuthGuard>
      {(user) => (
        <>
          <div className="flex h-[100dvh] w-full overflow-hidden bg-[#f8f7ff] text-[#211a3a] antialiased">
          <Sidebar
            active="notebook"
            userEmail={user.email}
            onLogout={() => {
              logout();
              router.push("/login");
            }}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <TopBar
              mode="global"
              activeTab="notebook"
              onOpenSidebar={() => setIsSidebarOpen(true)}
            />

            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="flex flex-col gap-6">
                  <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-11 h-11 rounded-2xl bg-[#eeeaff] border border-[#ddd6ff] flex items-center justify-center text-[#6d4aff] shadow-sm">
                          <Icon name="book" className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8068c9]">
                            Your study space
                          </p>
                          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#211a3a]">
                            Notebook
                          </h1>
                        </div>
                      </div>
                      <p className="text-[14px] text-[#756d86] max-w-2xl leading-6">
                        Keep your notes, study material, and useful PDFs together in one place.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={handlePdfUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#d8cbb5] bg-white text-[13px] font-semibold text-[#635947] hover:border-[#b28a4a] hover:text-[#6d4aff] shadow-sm transition disabled:opacity-60"
                      >
                        <Icon name="upload" className="w-4 h-4" />
                        {uploading ? `Uploading ${uploadProgress}%` : "Upload PDF"}
                      </button>
                      <button
                        type="button"
                        onClick={createNewNote}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6d4aff] text-white text-[13px] font-semibold hover:bg-[#5838dc] shadow-sm transition"
                      >
                        <Icon name="plus" className="w-4 h-4" />
                        New note
                      </button>
                    </div>
                  </header>

                  {error && (
                    <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-[#fff1ef] border border-[#f0c9c3] text-[13px] text-[#a13e34]">
                      <span className="mt-0.5 font-bold">!</span>
                      <span className="flex-1">{error}</span>
                      <button type="button" onClick={() => setError("")} aria-label="Dismiss">
                        <Icon name="close" className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-5 min-h-[620px]">
                    {/* Unified study timeline */}
                    <aside className="rounded-[24px] border border-[#e4e0f2] bg-white shadow-[0_8px_30px_rgba(83,68,45,0.06)] overflow-hidden flex flex-col min-h-[420px] xl:min-h-0">
                      <div className="px-5 py-4 border-b border-[#ece9f5]">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-[13px] font-bold text-[#2f2745]">Study timeline</h2>
                            <p className="text-[11px] text-[#918aa3] mt-0.5">Notes + PDFs together</p>
                          </div>
                          <span className="px-2 py-1 rounded-full bg-[#f0edff] text-[10px] font-bold text-[#7258c7]">
                            {timeline.length}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-3">
                        {isLoading ? (
                          <div className="p-5 text-center text-[13px] text-[#a39a8c]">Loading your notebook…</div>
                        ) : timeline.length === 0 ? (
                          <div className="p-5 rounded-2xl border border-dashed border-[#ddd8f0] bg-[#faf9ff] text-center">
                            <div className="w-12 h-12 rounded-2xl bg-[#eeeaff] text-[#7258c7] mx-auto flex items-center justify-center mb-3">
                              <Icon name="book" className="w-5 h-5" />
                            </div>
                            <p className="text-[13px] font-semibold text-[#514866]">Your notebook is empty</p>
                            <p className="text-[11px] text-[#918aa3] leading-5 mt-1.5">
                              Create a note or upload a PDF to start building your study space.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {timeline.map((item) => {
                              if (item.type === "note") {
                                const note = item.data;
                                const active = note.id === activeNoteId;
                                const isRenaming = renameId === note.id;

                                return (
                                  <div
                                    key={`note-${note.id}`}
                                    className={`group rounded-2xl border transition ${
                                      active
                                        ? "border-[#cfc5ff] bg-[#f6f3ff]"
                                        : "border-transparent hover:border-[#e8e4f4] hover:bg-[#faf9ff]"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => selectNote(note)}
                                      className="w-full text-left p-3.5"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-[#e8e2ff] text-[#6d4aff]" : "bg-[#f2f0f8] text-[#918aa3]"}`}>
                                          <Icon name="edit" className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className={`text-[13px] font-bold truncate ${active ? "text-[#5e45bd]" : "text-[#403851]"}`}>
                                              {note.title || "Untitled note"}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-[#918aa3] mt-1 truncate">
                                            {note.content || "Empty note"}
                                          </p>
                                          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#a69b8c]">
                                            <Icon name="clock" className="w-3 h-3" />
                                            {formatRelativeTime(note.updated_at)}
                                          </div>
                                        </div>
                                      </div>
                                    </button>

                                    <div className="px-3.5 pb-3 flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded-full bg-[#f0edff] text-[9px] font-bold uppercase tracking-wider text-[#735cc2]">
                                        Note
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => beginRename(note)}
                                        className="ml-auto opacity-70 sm:opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-[#7562b2] hover:text-[#5b43a9] transition"
                                      >
                                        Rename
                                      </button>
                                    </div>

                                    {isRenaming && (
                                      <div className="px-3.5 pb-3 flex gap-2">
                                        <input
                                          autoFocus
                                          value={renameValue}
                                          onChange={(event) => setRenameValue(event.target.value)}
                                          onKeyDown={(event) => {
                                            if (event.key === "Enter") saveRename();
                                            if (event.key === "Escape") cancelRename();
                                          }}
                                          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-[#d8cbb5] bg-white text-[11px] outline-none focus:border-[#b28a4a]"
                                        />
                                        <button type="button" onClick={saveRename} className="px-2 rounded-lg bg-[#6d4aff] text-white">
                                          <Icon name="check" className="w-3.5 h-3.5" />
                                        </button>
                                        <button type="button" onClick={cancelRename} className="px-2 rounded-lg border border-[#e0dced] text-[#81798f]">
                                          <Icon name="close" className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              const document = item.data;
                              const preview = document.extracted_text?.replace(/\s+/g, " ").trim() || "Uploaded study material";

                              return (
                                <div
                                  key={`pdf-${document.id}`}
                                  className="group rounded-2xl border border-transparent hover:border-[#e8e4f4] hover:bg-[#faf9ff] p-3.5 transition"
                                >
                                  <div className="flex gap-3">
                                    <div className="w-10 h-12 rounded-xl bg-[#f1eff8] border border-[#ded9ed] flex flex-col items-center justify-center shrink-0 text-[#7358c7]">
                                      <Icon name="file" className="w-5 h-5" />
                                      <span className="text-[7px] font-extrabold mt-0.5 tracking-wide">PDF</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[12px] font-bold text-[#403851] break-words leading-5">
                                        {document.filename}
                                      </p>
                                      <p className="text-[10px] text-[#918aa3] mt-0.5">
                                        {document.page_count ?? 0} pages{document.size_bytes ? ` · ${formatFileSize(document.size_bytes)}` : ""}
                                      </p>
                                      <p className="text-[10px] text-[#827a91] leading-4 mt-1.5 line-clamp-2">
                                        {preview}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 mt-3">
                                    <span className="px-2 py-0.5 rounded-full bg-[#f0edff] text-[9px] font-bold uppercase tracking-wider text-[#735cc2]">
                                      Source
                                    </span>
                                    <span className="text-[10px] text-[#aaa4b3]">{formatRelativeTime(document.uploaded_at)}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleViewPdf(document)}
                                      className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#6d4aff] text-white text-[10px] font-semibold hover:bg-[#5838dc] transition"
                                    >
                                      <Icon name="eye" className="w-3.5 h-3.5" />
                                      View
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="px-4 py-3 border-t border-[#ece9f5] bg-[#faf9ff]">
                        <div className="flex items-center gap-2 text-[10px] text-[#918aa3]">
                          <Icon name="spark" className="w-3.5 h-3.5 text-[#b28a4a]" />
                          <span>Tip: save useful AI answers here from Chat.</span>
                        </div>
                      </div>
                    </aside>

                    {/* Main notebook surface */}
                    <section className="min-w-0 rounded-[28px] border border-[#e4e0f2] bg-white shadow-[0_12px_40px_rgba(83,68,45,0.07)] overflow-hidden flex flex-col min-h-[620px]">
                      <div className="px-5 sm:px-7 pt-5 pb-4 border-b border-[#ece9f5] bg-white">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 rounded-full bg-[#f0edff] text-[9px] font-bold uppercase tracking-[0.12em] text-[#735cc2]">
                                Personal note
                              </span>
                              {activeNote && (
                                <span className="text-[10px] text-[#9992aa]">
                                  Edited {formatRelativeTime(activeNote.updated_at)}
                                </span>
                              )}
                            </div>
                            <input
                              value={title}
                              onChange={(event) => {
                                setTitle(event.target.value);
                                scheduleSave();
                              }}
                              placeholder="Untitled note"
                              className="w-full min-w-0 bg-transparent text-[25px] sm:text-[30px] font-bold tracking-tight text-[#2a223d] outline-none placeholder:text-[#c9c4d2]"
                            />
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {activeNoteId !== null && (
                              <button
                                type="button"
                                onClick={handleDeleteNote}
                                title="Delete note"
                                className="w-9 h-9 rounded-xl border border-transparent text-[#a69b8d] hover:border-[#ead1cc] hover:bg-[#fff3f1] hover:text-[#a13e34] flex items-center justify-center transition"
                              >
                                <Icon name="trash" className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-4">
                          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#f3f1f8] border border-[#ebe8f4]">
                            <button
                              type="button"
                              onClick={() => setViewMode("write")}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${viewMode === "write" ? "bg-white text-[#51486b] shadow-sm" : "text-[#958da7] hover:text-[#5e5672]"}`}
                            >
                              Write
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewMode("preview")}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${viewMode === "preview" ? "bg-white text-[#51486b] shadow-sm" : "text-[#958da7] hover:text-[#5e5672]"}`}
                            >
                              Preview
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-[#9b94ab]">
                            {isSaving ? (
                              <span>Saving…</span>
                            ) : saveMessage ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Icon name="check" className="w-3 h-3 text-[#7359c9]" />
                                {saveMessage}
                              </span>
                            ) : (
                              <span>Autosave on</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-h-0 overflow-y-auto bg-white">
                        {activeNoteId === null ? (
                          <div className="h-full min-h-[420px] flex items-center justify-center p-8">
                            <div className="max-w-md text-center">
                              <div className="w-16 h-16 rounded-[22px] bg-[#eeeaff] text-[#7258c7] flex items-center justify-center mx-auto mb-5">
                                <Icon name="book" className="w-7 h-7" />
                              </div>
                              <h2 className="text-xl font-bold text-[#302742]">Start a new study note</h2>
                              <p className="text-[13px] leading-6 text-[#817991] mt-2">
                                Capture lecture notes, formulas, summaries, or useful answers from ScholarAI.
                              </p>
                              <button
                                type="button"
                                onClick={createNewNote}
                                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6d4aff] text-white text-[12px] font-semibold hover:bg-[#5838dc] transition"
                              >
                                <Icon name="plus" className="w-4 h-4" />
                                Create first note
                              </button>
                            </div>
                          </div>
                        ) : viewMode === "write" ? (
                          <div className="relative min-h-full">
                            <div className="absolute left-7 top-0 bottom-0 w-px bg-[#f0e7d9] hidden sm:block" />
                            <textarea
                              value={content}
                              onChange={(event) => {
                                setContent(event.target.value);
                                scheduleSave();
                              }}
                              placeholder="Write your note here."
                              className="min-h-[480px] w-full resize-none bg-transparent outline-none p-7 sm:p-10 pl-7 sm:pl-14 text-[15px] leading-8 text-[#4f4860] placeholder:text-[#c5bfd3] font-[system-ui,sans-serif]"
                              spellCheck
                            />
                          </div>
                        ) : (
                          <article className="max-w-3xl mx-auto p-7 sm:p-10 sm:pt-9">
                            {content.trim() ? (
                              renderPreview(content)
                            ) : (
                              <div className="text-[14px] text-[#aaa4b3]">Nothing written yet. Switch to Write to start.</div>
                            )}
                          </article>
                        )}
                      </div>

                      <div className="px-5 sm:px-7 py-3 border-t border-[#ece9f5] bg-[#faf9ff] flex items-center justify-between gap-4">
                        <div className="text-[10px] text-[#918aa3]">
                          {content.length.toLocaleString()} characters
                        </div>
                        <button
                          type="button"
                          onClick={saveNote}
                          disabled={activeNoteId === null || isSaving}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#6d4aff] hover:bg-[#f0edff] disabled:text-[#c4bfd0] transition"
                        >
                          <Icon name="check" className="w-3.5 h-3.5" />
                          Save now
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </main>
          </div>

          {viewingPdfUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5">
          <div className="w-full h-full max-w-6xl bg-white rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3 border-b border-[#e8e1d6] bg-[#faf9ff]">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#765cc8]">
                  Notebook PDF
                </p>
                <p className="text-[13px] font-semibold text-[#302742] truncate mt-0.5">
                  {viewingPdfName}
                </p>
              </div>

              <button
                type="button"
                onClick={closePdfViewer}
                className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold text-[#5e5672] bg-[#f1eff8] hover:bg-[#e9e5f5] transition"
              >
                <Icon name="close" className="w-4 h-4" />
                Close
              </button>
            </div>

            <div className="flex-1 min-h-0 bg-[#f1f0f5]">
              <iframe
                src={viewingPdfUrl}
                title={`PDF preview - ${viewingPdfName}`}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
          )}
        </>
      )}
    </AuthGuard>
  );
}
