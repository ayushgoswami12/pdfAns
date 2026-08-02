"""
Lightweight persistence for ScholarAI.

Pinecone only stores vector chunks — it has no concept of "which files
have been uploaded" or "what conversations happened." This SQLite layer
covers both, so the frontend can show real Sources/Library lists and
real chat history instead of hardcoded demo data.

No auth/user concept yet (matches "keeping login aside" for now) —
everything is global, single-tenant. Add a user_id column to both
tables + WHERE clauses when auth lands.
"""
import sqlite3
import os
from datetime import datetime, timezone
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scholarai.db")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT UNIQUE NOT NULL,
                label TEXT,
                size_bytes INTEGER,
                chunk_count INTEGER,
                uploaded_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions (id)
            )
        """)
        conn.commit()


# ---- Sources -------------------------------------------------------------

def add_source(filename: str, label: str, size_bytes: int, chunk_count: int) -> None:
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO sources (filename, label, size_bytes, chunk_count, uploaded_at)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(filename) DO UPDATE SET
                 label=excluded.label,
                 size_bytes=excluded.size_bytes,
                 chunk_count=excluded.chunk_count,
                 uploaded_at=excluded.uploaded_at""",
            (filename, label, size_bytes, chunk_count, _now()),
        )
        conn.commit()


def list_sources() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM sources ORDER BY uploaded_at DESC").fetchall()
        return [dict(r) for r in rows]


def delete_source(filename: str) -> None:
    with get_conn() as conn:
        conn.execute("DELETE FROM sources WHERE filename = ?", (filename,))
        conn.commit()


# ---- Sessions & messages ---------------------------------------------------

def create_session(title: str) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO sessions (title, created_at) VALUES (?, ?)",
            (title, _now()),
        )
        conn.commit()
        return cur.lastrowid


def list_sessions() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM sessions ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]


def delete_session(session_id: int) -> None:
    with get_conn() as conn:
        conn.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()


def add_message(session_id: int, role: str, content: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)",
            (session_id, role, content, _now()),
        )
        conn.commit()


def list_messages(session_id: int) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM messages WHERE session_id = ? ORDER BY id ASC",
            (session_id,),
        ).fetchall()
        return [dict(r) for r in rows]