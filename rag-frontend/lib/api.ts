// Central API client for ScholarAI. Every page should go through this
// instead of hardcoding fetch() calls, so the local/Render auto-detect
// logic and error handling live in exactly one place.

const RENDER_API = "https://scholarai-tswp.onrender.com";
const LOCAL_API = "http://localhost:8000";
const FORCED_API = process.env.NEXT_PUBLIC_API_URL;

let cachedBase: string | null = null;

export async function getApiBase(): Promise<string> {
  if (FORCED_API) return FORCED_API;
  if (cachedBase) return cachedBase;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 900);
    const res = await fetch(`${LOCAL_API}/`, { signal: controller.signal, mode: "cors" });
    clearTimeout(timeout);
    if (res.ok) {
      cachedBase = LOCAL_API;
      return cachedBase;
    }
  } catch {
    // Local backend not reachable — fall through to Render.
  }
  cachedBase = RENDER_API;
  return cachedBase;
}

export interface SourceRow {
  id: number;
  filename: string;
  label: string;
  size_bytes: number;
  chunk_count: number;
  uploaded_at: string;
}

export interface SessionRow {
  id: number;
  title: string;
  created_at: string;
}

export interface MessageRow {
  id: number;
  session_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function listSources(): Promise<SourceRow[]> {
  const base = await getApiBase();
  const res = await fetch(`${base}/api/sources`);
  if (!res.ok) throw new Error(`Failed to load sources (${res.status})`);
  const data = await res.json();
  return data.sources;
}

export async function deleteSource(filename: string): Promise<void> {
  const base = await getApiBase();
  const res = await fetch(`${base}/api/sources/${encodeURIComponent(filename)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete ${filename} (${res.status})`);
}

export async function uploadFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ filename: string; label: string; size_bytes: number; chunk_count: number }> {
  const base = await getApiBase();
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/api/upload`, true);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        let detail = xhr.statusText;
        try {
          detail = JSON.parse(xhr.responseText).detail ?? detail;
        } catch {
          /* ignore parse failure, use statusText */
        }
        reject(new Error(detail || `Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network/CORS error during upload"));
    xhr.send(formData);
  });
}

export async function listSessions(): Promise<SessionRow[]> {
  const base = await getApiBase();
  const res = await fetch(`${base}/api/sessions`);
  if (!res.ok) throw new Error(`Failed to load sessions (${res.status})`);
  const data = await res.json();
  return data.sessions;
}

export async function createSession(title: string): Promise<SessionRow> {
  const base = await getApiBase();
  const formData = new FormData();
  formData.append("title", title);
  const res = await fetch(`${base}/api/sessions`, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Failed to create session (${res.status})`);
  return res.json();
}

export async function deleteSession(sessionId: number): Promise<void> {
  const base = await getApiBase();
  const res = await fetch(`${base}/api/sessions/${sessionId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete session (${res.status})`);
}

export async function getSessionMessages(sessionId: number): Promise<MessageRow[]> {
  const base = await getApiBase();
  const res = await fetch(`${base}/api/sessions/${sessionId}/messages`);
  if (!res.ok) throw new Error(`Failed to load messages (${res.status})`);
  const data = await res.json();
  return data.messages;
}

/**
 * Streams a chat answer, calling onChunk as text arrives. Resolves once
 * the stream ends. The backend saves both the user query and the full
 * assistant answer to that session's history server-side — no separate
 * "save message" call needed from the frontend.
 */
export async function streamChat(
  query: string,
  sessionId: number,
  onChunk: (chunk: string) => void
): Promise<void> {
  const base = await getApiBase();
  const formData = new FormData();
  formData.append("query", query);
  formData.append("session_id", String(sessionId));

  const res = await fetch(`${base}/api/chat`, { method: "POST", body: formData });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Server error ${res.status}: ${errorText}`);
  }
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}