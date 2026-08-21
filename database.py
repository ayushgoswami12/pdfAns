# FILE: database.py

"""
SQLite database for ScholarAI.

Stores:
- Users
- Uploaded PDF information
- Chat sessions
- Chat messages
- Quiz attempts
- Quiz questions
- Quiz answers

Quiz behavior:
- First quiz -> new questions
- Later quizzes -> previously incorrect questions + new questions
- Questions answered correctly are removed from the weak-question pool
- Questions answered incorrectly can appear again in future quizzes
"""

import sqlite3
import os
from datetime import datetime, timezone
from contextlib import contextmanager


DB_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "scholarai.db",
)


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


def _get_columns(conn, table_name: str) -> set[str]:
    rows = conn.execute(
        f"PRAGMA table_info({table_name})"
    ).fetchall()

    return {row["name"] for row in rows}


def _add_column_if_missing(
    conn,
    table_name: str,
    column_name: str,
    column_definition: str,
) -> None:
    columns = _get_columns(conn, table_name)

    if column_name not in columns:
        conn.execute(
            f"""
            ALTER TABLE {table_name}
            ADD COLUMN {column_name} {column_definition}
            """
        )


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def init_db():
    with get_conn() as conn:

        conn.execute("PRAGMA foreign_keys = ON")

        # ======================================================
        # USERS
        # ======================================================

        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT,
                created_at TEXT NOT NULL
            )
        """)

        _add_column_if_missing(
            conn,
            "users",
            "name",
            "TEXT",
        )

        _add_column_if_missing(
            conn,
            "users",
            "created_at",
            "TEXT",
        )

        conn.execute("""
            UPDATE users
            SET name = substr(email, 1, instr(email, '@') - 1)
            WHERE name IS NULL
               OR trim(name) = ''
        """)

        conn.execute("""
            UPDATE users
            SET created_at = ?
            WHERE created_at IS NULL
               OR created_at = ''
        """, (_now(),))

        # ======================================================
        # SOURCES
        # ======================================================

        conn.execute("""
            CREATE TABLE IF NOT EXISTS sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                filename TEXT NOT NULL,
                label TEXT,
                size_bytes INTEGER,
                chunk_count INTEGER,
                uploaded_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        _add_column_if_missing(
            conn,
            "sources",
            "user_id",
            "INTEGER",
        )

        _add_column_if_missing(
            conn,
            "sources",
            "label",
            "TEXT",
        )

        _add_column_if_missing(
            conn,
            "sources",
            "size_bytes",
            "INTEGER",
        )

        _add_column_if_missing(
            conn,
            "sources",
            "chunk_count",
            "INTEGER",
        )

        _add_column_if_missing(
            conn,
            "sources",
            "uploaded_at",
            "TEXT",
        )

        # ======================================================
        # SESSIONS
        # ======================================================

        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        _add_column_if_missing(
            conn,
            "sessions",
            "user_id",
            "INTEGER",
        )

        _add_column_if_missing(
            conn,
            "sessions",
            "title",
            "TEXT",
        )

        _add_column_if_missing(
            conn,
            "sessions",
            "created_at",
            "TEXT",
        )

        # ======================================================
        # MESSAGES
        # ======================================================

        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)

        _add_column_if_missing(
            conn,
            "messages",
            "session_id",
            "INTEGER",
        )

        _add_column_if_missing(
            conn,
            "messages",
            "role",
            "TEXT",
        )

        _add_column_if_missing(
            conn,
            "messages",
            "content",
            "TEXT",
        )

        _add_column_if_missing(
            conn,
            "messages",
            "created_at",
            "TEXT",
        )

        # ======================================================
        # QUIZ ATTEMPTS
        # ======================================================

        conn.execute("""
            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                completed_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)

        # ======================================================
        # QUIZ QUESTIONS
        # ======================================================

        conn.execute("""
            CREATE TABLE IF NOT EXISTS quiz_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                attempt_id INTEGER NOT NULL,
                fingerprint TEXT NOT NULL,
                question TEXT NOT NULL,
                options_json TEXT NOT NULL,
                correct_index INTEGER NOT NULL,
                explanation TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id)
            )
        """)

        # ======================================================
        # QUIZ ANSWERS
        # ======================================================

        conn.execute("""
            CREATE TABLE IF NOT EXISTS quiz_answers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                attempt_id INTEGER NOT NULL,
                question_id INTEGER NOT NULL,
                selected_index INTEGER,
                is_correct INTEGER NOT NULL,
                answered_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id),
                FOREIGN KEY (question_id) REFERENCES quiz_questions(id)
            )
        """)

        # ======================================================
        # BACKFILL LEGACY DATA
        # ======================================================

        first_user = conn.execute("""
            SELECT id
            FROM users
            ORDER BY id ASC
            LIMIT 1
        """).fetchone()

        if first_user:
            legacy_user_id = first_user["id"]

            conn.execute("""
                UPDATE sources
                SET user_id = ?
                WHERE user_id IS NULL
            """, (legacy_user_id,))

            conn.execute("""
                UPDATE sessions
                SET user_id = ?
                WHERE user_id IS NULL
            """, (legacy_user_id,))

        conn.execute("""
            UPDATE sources
            SET uploaded_at = ?
            WHERE uploaded_at IS NULL
               OR uploaded_at = ''
        """, (_now(),))

        conn.execute("""
            UPDATE sessions
            SET title = 'New Chat'
            WHERE title IS NULL
               OR trim(title) = ''
        """)

        conn.execute("""
            UPDATE sessions
            SET created_at = ?
            WHERE created_at IS NULL
               OR created_at = ''
        """, (_now(),))

        conn.execute("""
            UPDATE messages
            SET created_at = ?
            WHERE created_at IS NULL
               OR created_at = ''
        """, (_now(),))

        # ======================================================
        # REMOVE DUPLICATE SOURCES
        # ======================================================

        conn.execute("""
            DELETE FROM sources
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM sources
                GROUP BY user_id, filename
            )
        """)

        # ======================================================
        # INDEXES
        # ======================================================

        conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS
            idx_sources_user_filename
            ON sources(user_id, filename)
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_sources_user_id
            ON sources(user_id)
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_sessions_user_id
            ON sessions(user_id)
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_messages_session_id
            ON messages(session_id)
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_quiz_attempts_user_session
            ON quiz_attempts(user_id, session_id)
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_quiz_questions_fingerprint
            ON quiz_questions(fingerprint)
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_quiz_answers_question
            ON quiz_answers(question_id)
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_quiz_answers_user
            ON quiz_answers(user_id)
        """)

        conn.commit()


# ============================================================
# USERS
# ============================================================

def create_user(
    email: str,
    password_hash: str,
    name: str,
) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO users (
                email,
                password_hash,
                name,
                created_at
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                email,
                password_hash,
                name,
                _now(),
            ),
        )

        conn.commit()
        return cur.lastrowid


def get_user_by_email(email: str):
    with get_conn() as conn:
        row = conn.execute(
            """
            SELECT
                id,
                email,
                password_hash,
                name,
                created_at
            FROM users
            WHERE email = ?
            """,
            (email,),
        ).fetchone()

        return dict(row) if row else None


def get_user_by_id(user_id: int):
    with get_conn() as conn:
        row = conn.execute(
            """
            SELECT
                id,
                email,
                name,
                created_at
            FROM users
            WHERE id = ?
            """,
            (user_id,),
        ).fetchone()

        return dict(row) if row else None


# ============================================================
# SOURCES
# ============================================================

def add_source(
    user_id: int,
    filename: str,
    label: str,
    size_bytes: int,
    chunk_count: int,
) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO sources (
                user_id,
                filename,
                label,
                size_bytes,
                chunk_count,
                uploaded_at
            )
            VALUES (?, ?, ?, ?, ?, ?)

            ON CONFLICT(user_id, filename)
            DO UPDATE SET
                label = excluded.label,
                size_bytes = excluded.size_bytes,
                chunk_count = excluded.chunk_count,
                uploaded_at = excluded.uploaded_at
            """,
            (
                user_id,
                filename,
                label,
                size_bytes,
                chunk_count,
                _now(),
            ),
        )

        conn.commit()


def list_sources(user_id: int) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT
                id,
                user_id,
                filename,
                label,
                size_bytes,
                chunk_count,
                uploaded_at
            FROM sources
            WHERE user_id = ?
            ORDER BY uploaded_at DESC
            """,
            (user_id,),
        ).fetchall()

        return [dict(row) for row in rows]


def delete_source(
    user_id: int,
    filename: str,
) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            DELETE FROM sources
            WHERE user_id = ?
            AND filename = ?
            """,
            (
                user_id,
                filename,
            ),
        )

        conn.commit()


# ============================================================
# SESSIONS
# ============================================================

def create_session(
    user_id: int,
    title: str,
) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO sessions (
                user_id,
                title,
                created_at
            )
            VALUES (?, ?, ?)
            """,
            (
                user_id,
                title,
                _now(),
            ),
        )

        conn.commit()
        return cur.lastrowid


def list_sessions(
    user_id: int,
) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT
                id,
                user_id,
                title,
                created_at
            FROM sessions
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,),
        ).fetchall()

        return [dict(row) for row in rows]


def delete_session(
    user_id: int,
    session_id: int,
) -> None:
    with get_conn() as conn:

        conn.execute(
            """
            DELETE FROM messages
            WHERE session_id = ?
            AND EXISTS (
                SELECT 1
                FROM sessions
                WHERE sessions.id = messages.session_id
                AND sessions.id = ?
                AND sessions.user_id = ?
            )
            """,
            (
                session_id,
                session_id,
                user_id,
            ),
        )

        conn.execute(
            """
            DELETE FROM sessions
            WHERE id = ?
            AND user_id = ?
            """,
            (
                session_id,
                user_id,
            ),
        )

        conn.commit()


# ============================================================
# MESSAGES
# ============================================================

def add_message(
    user_id: int,
    session_id: int,
    role: str,
    content: str,
) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO messages (
                session_id,
                role,
                content,
                created_at
            )
            SELECT
                ?,
                ?,
                ?,
                ?
            WHERE EXISTS (
                SELECT 1
                FROM sessions
                WHERE id = ?
                AND user_id = ?
            )
            """,
            (
                session_id,
                role,
                content,
                _now(),
                session_id,
                user_id,
            ),
        )

        conn.commit()


def list_messages(
    user_id: int,
    session_id: int,
) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT
                messages.id,
                messages.session_id,
                messages.role,
                messages.content,
                messages.created_at
            FROM messages
            JOIN sessions
                ON sessions.id = messages.session_id
            WHERE messages.session_id = ?
            AND sessions.user_id = ?
            ORDER BY messages.id ASC
            """,
            (
                session_id,
                user_id,
            ),
        ).fetchall()

        return [dict(row) for row in rows]


# ============================================================
# QUIZ
# ============================================================

def create_quiz_attempt(
    user_id: int,
    session_id: int,
) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO quiz_attempts (
                user_id,
                session_id,
                created_at
            )
            VALUES (?, ?, ?)
            """,
            (
                user_id,
                session_id,
                _now(),
            ),
        )

        conn.commit()
        return cur.lastrowid


def add_quiz_question(
    attempt_id: int,
    fingerprint: str,
    question: str,
    options_json: str,
    correct_index: int,
    explanation: str,
) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO quiz_questions (
                attempt_id,
                fingerprint,
                question,
                options_json,
                correct_index,
                explanation,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                attempt_id,
                fingerprint,
                question,
                options_json,
                correct_index,
                explanation,
                _now(),
            ),
        )

        conn.commit()
        return cur.lastrowid


def get_seen_quiz_fingerprints(
    user_id: int,
    session_id: int,
) -> set[str]:
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT DISTINCT
                qq.fingerprint
            FROM quiz_questions qq
            JOIN quiz_attempts qa
                ON qa.id = qq.attempt_id
            WHERE qa.user_id = ?
            AND qa.session_id = ?
            """,
            (
                user_id,
                session_id,
            ),
        ).fetchall()

        return {
            row["fingerprint"]
            for row in rows
        }


def get_weak_quiz_questions(
    user_id: int,
    session_id: int,
    limit: int = 20,
) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT
                qq.id,
                qq.fingerprint,
                qq.question,
                qq.options_json,
                qq.correct_index,
                qq.explanation,
                MAX(qa.id) AS latest_answer_id
            FROM quiz_questions qq
            JOIN quiz_attempts qa_attempt
                ON qa_attempt.id = qq.attempt_id
            JOIN quiz_answers qa
                ON qa.question_id = qq.id
            WHERE qa_attempt.user_id = ?
            AND qa_attempt.session_id = ?
            AND qa.id = (
                SELECT MAX(qa2.id)
                FROM quiz_answers qa2
                JOIN quiz_questions qq2
                    ON qq2.id = qa2.question_id
                JOIN quiz_attempts qa2_attempt
                    ON qa2_attempt.id = qq2.attempt_id
                WHERE qq2.fingerprint = qq.fingerprint
                AND qa2_attempt.user_id = ?
                AND qa2_attempt.session_id = ?
            )
            GROUP BY
                qq.fingerprint
            HAVING (
                SELECT qa3.is_correct
                FROM quiz_answers qa3
                WHERE qa3.id = MAX(qa.id)
            ) = 0
            ORDER BY MAX(qa.answered_at) DESC
            LIMIT ?
            """,
            (
                user_id,
                session_id,
                user_id,
                session_id,
                limit,
            ),
        ).fetchall()

        return [
            {
                "fingerprint": row["fingerprint"],
                "question": row["question"],
                "options": __import__("json").loads(
                    row["options_json"]
                ),
                "correct_index": row["correct_index"],
                "explanation": row["explanation"],
            }
            for row in rows
        ]


def complete_quiz_attempt(
    user_id: int,
    attempt_id: int,
) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            UPDATE quiz_attempts
            SET completed_at = ?
            WHERE id = ?
            AND user_id = ?
            """,
            (
                _now(),
                attempt_id,
                user_id,
            ),
        )

        conn.commit()


def submit_quiz_answers(
    user_id: int,
    attempt_id: int,
    answers: list[dict],
) -> dict:
    with get_conn() as conn:

        attempt = conn.execute(
            """
            SELECT
                id,
                user_id,
                session_id
            FROM quiz_attempts
            WHERE id = ?
            AND user_id = ?
            """,
            (
                attempt_id,
                user_id,
            ),
        ).fetchone()

        if not attempt:
            raise ValueError(
                "Quiz attempt not found."
            )

        total = 0
        score = 0

        for answer in answers:

            question_id = int(
                answer["question_id"]
            )

            selected_index = answer.get(
                "selected_index"
            )

            row = conn.execute(
                """
                SELECT
                    id,
                    correct_index
                FROM quiz_questions
                WHERE id = ?
                AND attempt_id = ?
                """,
                (
                    question_id,
                    attempt_id,
                ),
            ).fetchone()

            if not row:
                continue

            is_correct = (
                selected_index is not None
                and int(selected_index)
                == int(row["correct_index"])
            )

            conn.execute(
                """
                INSERT INTO quiz_answers (
                    user_id,
                    attempt_id,
                    question_id,
                    selected_index,
                    is_correct,
                    answered_at
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    attempt_id,
                    question_id,
                    selected_index,
                    1 if is_correct else 0,
                    _now(),
                ),
            )

            total += 1

            if is_correct:
                score += 1

        conn.execute(
            """
            UPDATE quiz_attempts
            SET completed_at = ?
            WHERE id = ?
            AND user_id = ?
            """,
            (
                _now(),
                attempt_id,
                user_id,
            ),
        )

        conn.commit()

        return {
            "score": score,
            "total": total,
            "percentage": (
                round(
                    (score / total) * 100,
                    1,
                )
                if total
                else 0
            ),
        }