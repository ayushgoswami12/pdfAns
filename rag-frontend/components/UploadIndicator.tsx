// FILE: components/UploadIndicator.tsx
"use client";

import { IconFile, IconCheck } from "./icons";
import { ACCENT_GRADIENT } from "@/lib/theme";

export interface UploadJob {
  id: string;
  filename: string;
  progress: number;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
}

/**
 * One animated card per in-flight upload. Design intent:
 * - Slides/fades in on appearance (new upload started)
 * - Progress bar fill transitions smoothly rather than jumping
 * - Icon morphs from spinner -> checkmark (scale+fade) on success,
 *   rather than the row just vanishing or snapping to a static state
 */
export function UploadIndicatorCard({ job }: { job: UploadJob }) {
  const isDone = job.status === "success";
  const isError = job.status === "error";

  return (
    <div
      className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border bg-white shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
        isError ? "border-red-200" : isDone ? "border-emerald-200" : "border-violet-200"
      }`}
    >
      <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
        {/* Spinner ring — fades out once done */}
        <span
          className={`absolute inset-0 rounded-full border-[2.5px] border-violet-100 border-t-violet-500 transition-opacity duration-300 ${
            job.status === "uploading" ? "opacity-100 animate-spin" : "opacity-0"
          }`}
        />
        {/* Checkmark — scales/fades in on success */}
        <span
          className={`absolute inset-0 rounded-full bg-emerald-500 flex items-center justify-center text-white transition-all duration-300 ${
            isDone ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
        >
          <IconCheck width={16} height={16} />
        </span>
        {/* File glyph — visible at rest / on error */}
        <span
          className={`absolute inset-0 rounded-full bg-violet-50 flex items-center justify-center text-violet-500 transition-opacity duration-300 ${
            job.status === "error" ? "opacity-100" : "opacity-0"
          }`}
        >
          <IconFile width={15} height={15} />
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-medium text-gray-800 truncate m-0">{job.filename}</p>
        <p className={`text-[11.5px] truncate m-0 mt-0.5 ${isError ? "text-red-500" : "text-gray-500"}`}>
          {isError ? job.errorMessage || "Upload failed" : isDone ? "Indexed and ready" : "Uploading & indexing…"}
        </p>
        {!isDone && !isError && (
          <div className="h-1.5 w-full bg-violet-100 rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${job.progress}%`, background: ACCENT_GRADIENT }}
            />
          </div>
        )}
      </div>

      {!isDone && !isError && (
        <span className="shrink-0 text-[11px] font-bold text-violet-500 tabular-nums">{job.progress}%</span>
      )}
    </div>
  );
}

export default function UploadIndicatorStack({ jobs }: { jobs: UploadJob[] }) {
  if (jobs.length === 0) return null;
  return (
    <div className="space-y-2 w-full max-w-md mx-auto">
      {jobs.map((job) => (
        <UploadIndicatorCard key={job.id} job={job} />
      ))}
    </div>
  );
}