// FILE: lib/api.ts

const RENDER_API =
  "https://scholarai-tswp.onrender.com";

const LOCAL_API =
  "http://localhost:8000";

const FORCED_API =
  process.env.NEXT_PUBLIC_API_URL;

let cachedBase:
  string | null = null;


// ============================================================
// API BASE
// ============================================================

export async function getApiBase(): Promise<string> {

  if (
    typeof window !==
    "undefined"
  ) {

    const hostname =
      window.location.hostname;

    if (
      hostname ===
        "localhost" ||
      hostname ===
        "127.0.0.1"
    ) {
      return LOCAL_API;
    }
  }


  if (FORCED_API) {
    return FORCED_API.replace(
      /\/+$/,
      ""
    );
  }


  if (cachedBase) {
    return cachedBase;
  }


  cachedBase =
    RENDER_API;

  return cachedBase;
}


// ============================================================
// TOKEN
// ============================================================

const TOKEN_KEY =
  "scholarai:token";


export function getToken():
  string | null {

  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  return localStorage.getItem(
    TOKEN_KEY
  );
}


export function setToken(
  token: string
): void {

  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    TOKEN_KEY,
    token
  );
}


export function clearToken():
  void {

  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    TOKEN_KEY
  );
}


function authHeaders():
  Record<string, string> {

  const token =
    getToken();

  if (!token) {
    return {};
  }

  return {
    Authorization:
      `Bearer ${token}`,
  };
}


async function checkAuthFailure(
  res: Response
): Promise<void> {

  if (
    res.status === 401 ||
    res.status === 403
  ) {
    clearToken();
  }
}


// ============================================================
// TYPES
// ============================================================

export interface SourceRow {
  id: number;
  filename: string;
  label: string;
  size_bytes: number;
  chunk_count: number;
  uploaded_at: string;
  user_id?: number;
}

export interface NotebookNote {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NotebookDocument {
  id: number;
  user_id: number;
  filename: string;
  size_bytes: number | null;
  page_count: number | null;
  uploaded_at: string;
}



export interface SessionRow {
  id: number;
  title: string;
  created_at: string;
  user_id?: number;
}


export interface MessageRow {
  id: number;
  session_id: number;
  role:
    | "user"
    | "assistant";
  content: string;
  created_at: string;
}


export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}


export interface GeneratedQuiz {
  attempt_id: number;
  questions: QuizQuestion[];
  count: number;
}


export interface QuizAnswer {
  question_id: number;
  selected_index:
    number | null;
}


export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
}


// ============================================================
// CURRENT USER
// ============================================================

export async function getCurrentUser():
  Promise<{
    id: number;
    email: string;
    name: string | null;
  } | null> {

  const token =
    getToken();

  if (!token) {
    return null;
  }

  const base =
    await getApiBase();

  const res =
    await fetch(
      `${base}/auth/me`,
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,

          Accept:
            "application/json",
        },

        cache:
          "no-store",
      }
    );


  if (
    res.status === 401 ||
    res.status === 403
  ) {

    clearToken();

    return null;
  }


  if (!res.ok) {

    throw new Error(
      `Authentication check failed (${res.status})`
    );
  }


  return res.json();
}


// ============================================================
// OCR / PYQ ANALYSIS
// ============================================================

export interface OcrUploadResult {
  filename: string;
  document_id: number;
  document_type: string;
  size_bytes: number;
  page_count: number;
  ocr_used: boolean;
  question_count: number;
}


export async function uploadOcrDocument(
  file: File,
  documentType: "auto" | "syllabus" | "pyq" | "other" = "auto",
  onProgress?: (percent: number) => void
): Promise<OcrUploadResult> {
  const base = await getApiBase();
  const token = getToken();

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", documentType);

    const xhr = new XMLHttpRequest();

    xhr.open(
      "POST",
      `${base}/api/ocr/upload`,
      true
    );

    if (token) {
      xhr.setRequestHeader(
        "Authorization",
        `Bearer ${token}`
      );
    }

    xhr.upload.onprogress = (event) => {
      if (
        event.lengthComputable &&
        onProgress
      ) {
        onProgress(
          Math.round(
            (event.loaded / event.total) * 100
          )
        );
      }
    };

    xhr.onload = () => {
      if (
        xhr.status >= 200 &&
        xhr.status < 300
      ) {
        try {
          resolve(
            JSON.parse(xhr.responseText)
          );
        } catch {
          reject(
            new Error(
              "Invalid OCR response from server."
            )
          );
        }
        return;
      }

      if (
        xhr.status === 401 ||
        xhr.status === 403
      ) {
        clearToken();
      }

      let detail = xhr.statusText;

      try {
        const data = JSON.parse(
          xhr.responseText
        );

        detail =
          data.detail ??
          data.message ??
          detail;
      } catch {
        // Ignore invalid error JSON.
      }

      reject(
        new Error(
          detail ||
            `OCR upload failed (${xhr.status})`
        )
      );
    };

    xhr.onerror = () => {
      reject(
        new Error(
          "Network/CORS error during OCR upload."
        )
      );
    };

    xhr.onabort = () => {
      reject(
        new Error(
          "OCR upload was cancelled."
        )
      );
    };

    xhr.send(formData);
  });
}


export async function generateChapterWisePyq(): Promise<{
  markdown: string;
  syllabus: string;
  papers: string[];
}> {
  const base = await getApiBase();

  const res = await fetch(
    `${base}/api/ocr/chapter-wise-pyq`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );

  if (!res.ok) {
    await checkAuthFailure(res);

    const data = await res
      .json()
      .catch(() => ({}));

    throw new Error(
      data.detail ||
        `Failed to generate chapter-wise PYQs (${res.status})`
    );
  }

  const data = await res.json();

  return {
    markdown: data.markdown ?? "",
    syllabus: data.syllabus ?? "",
    papers: data.papers ?? [],
  };
}


// ============================================================
// SOURCES
// ============================================================

export async function listSources():
  Promise<SourceRow[]> {

  const base =
    await getApiBase();

  const res =
    await fetch(
      `${base}/api/sources`,
      {
        method:
          "GET",

        headers:
          authHeaders(),

        cache:
          "no-store",
      }
    );


  if (!res.ok) {

    await checkAuthFailure(
      res
    );

    throw new Error(
      `Failed to load sources (${res.status})`
    );
  }


  const data =
    await res.json();

  return (
    data.sources ??
    []
  );
}


export async function deleteSource(
  filename: string
): Promise<void> {

  const base =
    await getApiBase();

  const res =
    await fetch(
      `${base}/api/sources/${encodeURIComponent(filename)}`,
      {
        method:
          "DELETE",

        headers:
          authHeaders(),
      }
    );


  if (!res.ok) {

    await checkAuthFailure(
      res
    );

    throw new Error(
      `Failed to delete ${filename} (${res.status})`
    );
  }
}


// ============================================================
// UPLOAD
// ============================================================

export async function uploadFile(
  file: File,
  onProgress?: (
    percent: number
  ) => void
): Promise<{
  filename: string;
  label: string;
  size_bytes: number;
  chunk_count: number;
}> {

  const base =
    await getApiBase();

  const token =
    getToken();

  const lowerName = file.name.toLowerCase();

  const isImage =
    /\.(png|jpe?g|webp|bmp|tiff?)$/i.test(
      lowerName
    );

  const looksLikeOcrDocument =
    /syllabus|pyq|previous[-_ ]?year|question[-_ ]?paper/.test(
      lowerName
    );

  const endpoint =
    isImage || looksLikeOcrDocument
      ? "/api/ocr/upload"
      : "/api/upload";


  return new Promise(
    (
      resolve,
      reject
    ) => {

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );


      const xhr =
        new XMLHttpRequest();

      xhr.open(
        "POST",
        `${base}${endpoint}`,
        true
      );


      if (token) {

        xhr.setRequestHeader(
          "Authorization",
          `Bearer ${token}`
        );
      }


      xhr.upload.onprogress =
        (event) => {

          if (
            event.lengthComputable &&
            onProgress
          ) {

            onProgress(
              Math.round(
                (
                  event.loaded /
                  event.total
                ) *
                100
              )
            );
          }
        };


      xhr.onload = () => {

        if (
          xhr.status >= 200 &&
          xhr.status < 300
        ) {

          try {

            resolve(
              JSON.parse(
                xhr.responseText
              )
            );

          } catch {

            reject(
              new Error(
                "Invalid response from server."
              )
            );
          }

          return;
        }


        if (
          xhr.status === 401 ||
          xhr.status === 403
        ) {

          clearToken();
        }


        let detail =
          xhr.statusText;


        try {

          const data =
            JSON.parse(
              xhr.responseText
            );

          detail =
            data.detail ??
            data.message ??
            detail;

        } catch {
          // Ignore.
        }


        reject(
          new Error(
            detail ||
              `Upload failed (${xhr.status})`
          )
        );
      };


      xhr.onerror = () => {

        reject(
          new Error(
            "Network/CORS error during upload."
          )
        );
      };


      xhr.onabort = () => {

        reject(
          new Error(
            "Upload was cancelled."
          )
        );
      };


      xhr.send(
        formData
      );
    }
  );
}


// ============================================================
// SESSIONS
// ============================================================

export async function listSessions():
  Promise<SessionRow[]> {

  const base =
    await getApiBase();

  const res =
    await fetch(
      `${base}/api/sessions`,
      {
        method:
          "GET",

        headers:
          authHeaders(),

        cache:
          "no-store",
      }
    );


  if (!res.ok) {

    await checkAuthFailure(
      res
    );

    throw new Error(
      `Failed to load sessions (${res.status})`
    );
  }


  const data =
    await res.json();

  return (
    data.sessions ??
    []
  );
}


export async function createSession(
  title: string
): Promise<SessionRow> {

  const base =
    await getApiBase();

  const formData =
    new FormData();

  formData.append(
    "title",
    title
  );


  const res =
    await fetch(
      `${base}/api/sessions`,
      {
        method:
          "POST",

        headers:
          authHeaders(),

        body:
          formData,
      }
    );


  if (!res.ok) {

    await checkAuthFailure(
      res
    );

    throw new Error(
      `Failed to create session (${res.status})`
    );
  }


  return res.json();
}


export async function deleteSession(
  sessionId: number
): Promise<void> {

  const base =
    await getApiBase();

  const res =
    await fetch(
      `${base}/api/sessions/${sessionId}`,
      {
        method:
          "DELETE",

        headers:
          authHeaders(),
      }
    );


  if (!res.ok) {

    await checkAuthFailure(
      res
    );

    throw new Error(
      `Failed to delete session (${res.status})`
    );
  }
}


export async function getSessionMessages(
  sessionId: number
): Promise<MessageRow[]> {

  const base =
    await getApiBase();

  const res =
    await fetch(
      `${base}/api/sessions/${sessionId}/messages`,
      {
        method:
          "GET",

        headers:
          authHeaders(),

        cache:
          "no-store",
      }
    );


  if (!res.ok) {

    await checkAuthFailure(
      res
    );

    throw new Error(
      `Failed to load messages (${res.status})`
    );
  }


  const data =
    await res.json();

  return (
    data.messages ??
    []
  );
}


// ============================================================
// CHAT
// ============================================================

export async function streamChat(
  query: string,
  sessionId: number,
  onChunk: (
    chunk: string
  ) => void
): Promise<void> {

  const base =
    await getApiBase();

  const formData =
    new FormData();


  formData.append(
    "query",
    query
  );


  formData.append(
    "session_id",
    String(
      sessionId
    )
  );


  const res =
    await fetch(
      `${base}/api/chat`,
      {
        method:
          "POST",

        headers:
          authHeaders(),

        body:
          formData,
      }
    );


  if (!res.ok) {

    await checkAuthFailure(
      res
    );

    const errorText =
      await res.text();

    throw new Error(
      `Server error ${res.status}: ${errorText}`
    );
  }


  if (!res.body) {

    throw new Error(
      "No response body"
    );
  }


  const reader =
    res.body.getReader();

  const decoder =
    new TextDecoder();


  while (true) {

    const {
      value,
      done,
    } =
      await reader.read();


    if (done) {
      break;
    }


    if (value) {

      onChunk(
        decoder.decode(
          value,
          {
            stream: true,
          }
        )
      );
    }
  }


  const remaining =
    decoder.decode();


  if (remaining) {

    onChunk(
      remaining
    );
  }
}


// ============================================================
// QUIZ GENERATION
// ============================================================

export async function generateQuiz(
  sessionId: number,
  numQuestions = 5
): Promise<GeneratedQuiz> {

  const base =
    await getApiBase();


  const formData =
    new FormData();

  formData.append(
    "num_questions",
    String(
      numQuestions
    )
  );


  const res =
    await fetch(
      `${base}/api/sessions/${sessionId}/quiz`,
      {
        method:
          "POST",

        headers:
          authHeaders(),

        body:
          formData,
      }
    );


  if (!res.ok) {

    await checkAuthFailure(
      res
    );


    const data =
      await res
        .json()
        .catch(
          () => ({})
        );


    throw new Error(
      data.detail ||
        `Failed to generate quiz (${res.status})`
    );
  }


  return res.json();
}


// ============================================================
// QUIZ SUBMISSION
// ============================================================

export async function submitQuizAttempt(
  attemptId: number,
  answers: QuizAnswer[]
): Promise<QuizResult> {

  const base =
    await getApiBase();


  const res =
    await fetch(
      `${base}/api/quiz/${attemptId}/submit`,
      {
        method:
          "POST",

        headers: {
          ...authHeaders(),

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            answers,
          }),
      }
    );


  if (!res.ok) {

    await checkAuthFailure(
      res
    );


    const data =
      await res
        .json()
        .catch(
          () => ({})
        );


    throw new Error(
      data.detail ||
        `Failed to save quiz results (${res.status})`
    );
  }


  return res.json();
}

// ============================================================
// NOTEBOOK
// ============================================================

export async function listNotebookNotes(): Promise<NotebookNote[]> {
  const base = await getApiBase();
  const res = await fetch(`${base}/api/notebook/notes`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    await checkAuthFailure(res);
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to load notebook notes (${res.status})`);
  }

  const data = await res.json();
  return data.notes ?? [];
}

export async function createNotebookNote(title: string, content: string): Promise<NotebookNote> {
  const base = await getApiBase();
  const res = await fetch(`${base}/api/notebook/notes`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });

  if (!res.ok) {
    await checkAuthFailure(res);
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to create notebook note (${res.status})`);
  }

  return res.json();
}

export async function updateNotebookNote(noteId: number, title: string, content: string): Promise<NotebookNote> {
  const base = await getApiBase();
  const res = await fetch(`${base}/api/notebook/notes/${noteId}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });

  if (!res.ok) {
    await checkAuthFailure(res);
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to save notebook note (${res.status})`);
  }

  return res.json();
}

export async function deleteNotebookNote(noteId: number): Promise<void> {
  const base = await getApiBase();
  const res = await fetch(`${base}/api/notebook/notes/${noteId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) {
    await checkAuthFailure(res);
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to delete notebook note (${res.status})`);
  }
}

export async function addResponseToNotebook(content: string, title = "AI Response"): Promise<NotebookNote> {
  return createNotebookNote(title, content);
}

export async function listNotebookDocuments(): Promise<NotebookDocument[]> {
  const base = await getApiBase();
  const res = await fetch(`${base}/api/notebook/documents`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    await checkAuthFailure(res);
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to load notebook PDFs (${res.status})`);
  }

  const data = await res.json();
  return data.documents ?? [];
}

export async function getNotebookDocumentViewUrl(documentId: number): Promise<string> {
  const base = await getApiBase();
  const token = getToken();

  if (!token) {
    throw new Error("Please log in again.");
  }

  // The backend requires the bearer token, so the browser cannot simply
  // open the endpoint in a new tab. Fetch the PDF and create a temporary
  // object URL instead.
  const res = await fetch(
    `${base}/api/notebook/documents/${documentId}/view`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    await checkAuthFailure(res);
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to open notebook PDF (${res.status})`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}


export async function uploadNotebookPdf(file: File, onProgress?: (percent: number) => void): Promise<NotebookDocument & { ocr_used?: boolean }> {
  const base = await getApiBase();
  const token = getToken();

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/api/notebook/upload`);

    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let data: any = {};
      try { data = JSON.parse(xhr.responseText || "{}"); } catch { data = {}; }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
        return;
      }

      if (xhr.status === 401) clearToken();
      reject(new Error(data.detail || `Notebook PDF upload failed (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error("Network/CORS error during notebook PDF upload."));
    xhr.onabort = () => reject(new Error("Notebook PDF upload was cancelled."));
    xhr.send(formData);
  });
}
