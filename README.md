# PDF RAG Chatbot

A full-stack AI chatbot that lets you upload PDF documents and ask questions about them. Built with Python, FastAPI, MistralAI, ChromaDB, and Next.js.

---

## What This App Does

- Upload any PDF document
- The app reads, chunks, and stores it in a vector database (ChromaDB)
- Ask questions about the document in a chat interface
- The AI (Mistral) finds the most relevant parts of the PDF and answers using only that content
- Responses stream in real time, word by word

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | Mistral AI (`mistral-small-2506`) |
| Embeddings | MistralAI Embeddings |
| Vector DB | ChromaDB (local, persisted to disk) |
| RAG Framework | LangChain |
| Backend | FastAPI + Uvicorn |
| Frontend | Next.js 16 + Tailwind CSS |
| PDF Parsing | PyPDFLoader (LangChain) |

---

## Project Structure

```
pdfReader/
├── main.py               # Core RAG logic (embeddings, retriever, LLM, prompt)
├── server.py             # FastAPI backend (REST API endpoints)
├── app.py                # Original Streamlit UI (retired, replaced by Next.js)
├── database.py           # ChromaDB setup utilities
├── requirements.txt      # Python dependencies
├── ChromaDB/             # Persisted vector store (auto-created)
├── start.bat             # One-click startup script (Windows)
├── ecosystem.config.js   # PM2 config (optional)
└── rag-frontend/         # Next.js frontend
    ├── app/
    │   ├── page.tsx      # Main chat UI
    │   ├── layout.tsx    # Root layout
    │   └── globals.css   # Global styles
    ├── next.config.ts    # Next.js config (allowedDevOrigins)
    └── package.json
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- A Mistral AI API key → https://console.mistral.ai

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/ayushgoswami12/pdfReader.git
cd pdfReader
```

### 2. Create a virtual environment and install Python dependencies

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Add your API key

Create a `.env` file in the root `pdfReader/` folder:

```
MISTRAL_API_KEY=your_mistral_api_key_here
```

> Never commit this file. It is already in `.gitignore`.

### 4. Install frontend dependencies

```powershell
cd rag-frontend
npm install
cd ..
```

---

## Running the App

### Option A — One click (Windows)

Double-click `start.bat` in File Explorer. It opens two terminals automatically:
- One running the FastAPI backend on port `8000`
- One running the Next.js frontend on port `3000`

### Option B — Manual (two terminals)

**Terminal 1 — Backend:**
```powershell
cd D:\pdfReader
.venv\Scripts\activate
python server.py
```

**Terminal 2 — Frontend:**
```powershell
cd D:\pdfReader\rag-frontend
npm run dev
```

Then open your browser at:
```
http://localhost:3000
```

---

## How It Works (Step by Step)

### Uploading a PDF

1. User clicks "Upload PDF" in the sidebar
2. Next.js sends the file to `POST /api/upload` on the FastAPI backend
3. FastAPI saves it to a temp file and loads it with `PyPDFLoader`
4. The text is split into chunks (`chunk_size=1500`, `chunk_overlap=250`)
5. Each chunk is embedded using MistralAI Embeddings
6. Embeddings are stored in ChromaDB (persisted in the `ChromaDB/` folder)

### Asking a Question

1. User types a question and hits Enter
2. Next.js sends it to `POST /api/chat`
3. FastAPI runs MMR retrieval on ChromaDB — fetches 10 candidates, returns top 4 most diverse
4. The retrieved chunks are injected into a prompt as `{context}`
5. Mistral streams the response token by token
6. Next.js reads the stream and renders each chunk as it arrives

### RAG Retrieval Settings

```python
search_type = "mmr"         # Maximum Marginal Relevance — balances relevance + diversity
k = 4                       # Return top 4 chunks
fetch_k = 10                # Fetch 10 candidates first
lambda_mult = 0.5           # 0 = max diversity, 1 = max relevance
```

---

## API Endpoints

### `POST /api/upload`
Upload a PDF to the knowledge base.

- **Body:** `multipart/form-data` with field `file`
- **Response:** `{ "message": "Successfully processed filename.pdf." }`

### `POST /api/chat`
Ask a question. Returns a streaming plain-text response.

- **Body:** `multipart/form-data` with field `query`
- **Response:** `text/event-stream` (streamed tokens)

---

## Environment Variables

| Variable | Description |
|---|---|
| `MISTRAL_API_KEY` | Your Mistral AI API key |

---

## Common Issues

| Problem | Fix |
|---|---|
| Button is greyed out | Click inside the input field and type — it activates on input |
| `npm install` hangs | Use `npm install --registry https://registry.npmmirror.com` |
| Frontend not loading on network IP | Add `allowedDevOrigins: ['your-ip']` to `next.config.ts` |
| Backend not responding | Make sure `python server.py` is running and `.env` has your API key |
| ChromaDB empty after restart | Normal — ChromaDB persists to disk, re-upload your PDFs if folder was deleted |

---

## Future Improvements

- [ ] Show uploaded document names in sidebar
- [ ] Support multiple PDFs with source tracking
- [ ] Deploy backend to Railway / Render
- [ ] Deploy frontend to Vercel
- [ ] Add authentication
- [ ] Show which PDF chunks were used to answer each question

---

## License

MIT
