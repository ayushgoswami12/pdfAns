# FILE: server.py

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form,
    HTTPException,
    Depends,
)

from fastapi.responses import StreamingResponse

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from typing import Optional

import tempfile
import os
import asyncio
import traceback
import sys
import json


# ============================================================
# RAG IMPORTS
# ============================================================

try:

    from main import (
        llm,
        prompt,
        fallback_prompt,
        vectorStore,
        index,
        SENTINEL,
        SUPPLEMENT_TAG,
        is_repeated_question_query,
        get_user_context_docs,
        register_source,
        generate_quiz,
        wait_for_mistral_slot,
        is_rate_limit_error,
    )

    print(
        "Successfully imported RAG components from main.py"
    )

except Exception as e:

    print(
        "ERROR importing RAG components:",
        str(e),
    )

    print(
        traceback.format_exc()
    )

    sys.exit(1)


import database as db
import auth


from langchain_community.document_loaders import (
    PyPDFLoader,
)

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
)


# ============================================================
# APP
# ============================================================

app = FastAPI()


# ============================================================
# MISTRAL CHAT RATE LIMIT PROTECTION
# ============================================================

llm_semaphore = asyncio.Semaphore(1)


async def call_llm_with_retry(
    prompt_input,
    max_retries: int = 2,
):

    for attempt in range(
        max_retries + 1
    ):

        try:

            async with llm_semaphore:

                await asyncio.to_thread(
                    wait_for_mistral_slot
                )

                return await llm.ainvoke(
                    prompt_input
                )

        except Exception as exc:

            if not is_rate_limit_error(
                exc
            ):
                raise

            if attempt >= max_retries:

                raise HTTPException(
                    status_code=503,
                    detail=(
                        "ScholarAI is temporarily "
                        "rate-limited by the Mistral "
                        "Free tier. Please wait a "
                        "moment and try again."
                    ),
                )

            wait_seconds = (
                2 ** attempt
            )

            print(
                "Mistral chat rate limited (429). "
                f"Retrying in {wait_seconds}s..."
            )

            await asyncio.sleep(
                wait_seconds
            )


async def stream_llm_with_retry(
    prompt_input,
    max_retries: int = 2,
):

    for attempt in range(
        max_retries + 1
    ):

        yielded_any = False

        try:

            async with llm_semaphore:

                await asyncio.to_thread(
                    wait_for_mistral_slot
                )

                async for chunk in llm.astream(
                    prompt_input
                ):

                    yielded_any = True

                    yield chunk

            return

        except Exception as exc:

            if not is_rate_limit_error(
                exc
            ):
                raise

            if yielded_any:

                raise HTTPException(
                    status_code=503,
                    detail=(
                        "The Mistral service was "
                        "rate-limited while generating "
                        "the answer."
                    ),
                )

            if attempt >= max_retries:

                raise HTTPException(
                    status_code=503,
                    detail=(
                        "ScholarAI is temporarily "
                        "rate-limited by the Mistral "
                        "Free tier. Please wait a "
                        "moment and try again."
                    ),
                )

            wait_seconds = (
                2 ** attempt
            )

            print(
                "Mistral chat stream rate limited (429). "
                f"Retrying in {wait_seconds}s..."
            )

            await asyncio.sleep(
                wait_seconds
            )


# ============================================================
# AUTHENTICATION
# ============================================================

class SignupRequest(BaseModel):

    email: str
    password: str
    name: str


class LoginRequest(BaseModel):

    email: str
    password: str


@app.post(
    "/auth/signup"
)
async def signup(
    data: SignupRequest,
):

    email = (
        data.email
        .strip()
        .lower()
    )

    password = data.password

    name = (
        data.name
        .strip()
    )

    if len(password) < 6:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must be at least "
                "6 characters."
            ),
        )

    if not name:

        raise HTTPException(
            status_code=400,
            detail="Name is required.",
        )

    try:

        existing_user = (
            db.get_user_by_email(
                email
            )
        )

    except Exception as e:

        print(
            "ERROR checking existing user:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Database error while "
                "checking account."
            ),
        )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail=(
                "An account with this email "
                "already exists."
            ),
        )

    try:

        password_hash = (
            auth.hash_password(
                password
            )
        )

        user_id = db.create_user(
            email=email,
            password_hash=password_hash,
            name=name,
        )

        token = (
            auth.create_access_token(
                user_id
            )
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "email": email,
                "name": name,
            },
        }

    except HTTPException:

        raise

    except Exception as e:

        print(
            "ERROR during signup:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to create account."
            ),
        )


@app.post(
    "/auth/login"
)
async def login(
    data: LoginRequest,
):

    email = (
        data.email
        .strip()
        .lower()
    )

    password = data.password

    try:

        user = (
            db.get_user_by_email(
                email
            )
        )

    except Exception as e:

        print(
            "ERROR loading user during login:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Database error during login."
            ),
        )

    if not user:

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password."
            ),
        )

    try:

        password_valid = (
            auth.verify_password(
                password,
                user["password_hash"],
            )
        )

    except Exception as e:

        print(
            "ERROR verifying password:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to verify password."
            ),
        )

    if not password_valid:

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password."
            ),
        )

    try:

        token = (
            auth.create_access_token(
                user["id"]
            )
        )

    except Exception as e:

        print(
            "ERROR creating JWT:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to create login session."
            ),
        )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name"),
        },
    }


@app.get(
    "/auth/me"
)
async def me(
    user_id: int = Depends(
        auth.get_current_user
    ),
):

    try:

        user = (
            db.get_user_by_id(
                user_id
            )
        )

    except Exception as e:

        print(
            "ERROR loading current user:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Database error while "
                "loading user."
            ),
        )

    if not user:

        raise HTTPException(
            status_code=401,
            detail=(
                "User no longer exists."
            ),
        )

    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name"),
    }


# ============================================================
# DATABASE STARTUP
# ============================================================

@app.on_event(
    "startup"
)
async def on_startup():

    try:

        db.init_db()

        print(
            "Database ready at",
            db.DB_PATH,
        )

    except Exception as e:

        print(
            "ERROR initializing database:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise


# ============================================================
# ROOT
# ============================================================

@app.get("/")
async def root():

    return {
        "status": "ok",
        "message": (
            "ScholarAI backend is running"
        ),
    }


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://scholarai-mu.vercel.app",
        "https://scholarai.vercel.app",
    ],

    allow_origin_regex=(
        r"^https://scholarai-[a-zA-Z0-9-]+\.vercel\.app$"
    ),

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# CHAT
# ============================================================

async def response_generator(
    query: str,
    session_id: Optional[int],
    user_id: int,
):

    print(
        f"Received query: {query} "
        f"(user_id={user_id})"
    )

    full_answer = ""

    try:

        query = query.strip()

        if not query:

            yield (
                "Please enter a question."
            )

            return

        # ====================================================
        # GREETINGS
        # ====================================================

        normalized = (
            " ".join(
                query.lower().split()
            )
        )

        if normalized in {
            "hi",
            "hello",
            "hey",
            "hii",
            "good morning",
            "good afternoon",
            "good evening",
        }:

            answer = (
                "Hello! I’m ScholarAI. "
                "Ask me anything about your "
                "study material."
            )

            full_answer = answer

            yield answer

            return

        # ====================================================
        # RETRIEVAL
        # ====================================================

        docs = (
            get_user_context_docs(
                query,
                user_id=user_id,
                wide=(
                    is_repeated_question_query(
                        query
                    )
                ),
            )
        )

        context = "\n\n".join(
            doc.page_content
            for doc in docs
        )

        # ====================================================
        # NO PDF CONTEXT
        # ====================================================

        if not context.strip():

            fallback_input = (
                fallback_prompt.invoke(
                    {
                        "question":
                            query,
                    }
                )
            )

            async for fb_chunk in (
                stream_llm_with_retry(
                    fallback_input
                )
            ):

                chunk_text = getattr(
                    fb_chunk,
                    "content",
                    "",
                )

                if not isinstance(
                    chunk_text,
                    str,
                ):

                    chunk_text = str(
                        chunk_text
                    )

                if not chunk_text:
                    continue

                full_answer += (
                    chunk_text
                )

                yield chunk_text

                await asyncio.sleep(
                    0.01
                )

            suffix = (
                "\n\n(material needed )"
            )

            full_answer += suffix

            yield suffix

        # ====================================================
        # PDF CONTEXT
        # ====================================================

        else:

            new_prompt = (
                prompt.invoke(
                    {
                        "context":
                            context,

                        "question":
                            query,
                    }
                )
            )

            first_pass = (
                await call_llm_with_retry(
                    new_prompt
                )
            )

            answer_text = (
                first_pass.content
            )

            if not isinstance(
                answer_text,
                str,
            ):

                answer_text = str(
                    answer_text
                )

            if (
                SENTINEL.lower()
                in answer_text.lower()
            ):

                full_answer = (
                    answer_text.strip()
                )

                yield full_answer

            else:

                was_supplemented = (
                    SUPPLEMENT_TAG
                    in answer_text
                )

                answer_text = (
                    answer_text
                    .replace(
                        SUPPLEMENT_TAG,
                        "",
                    )
                    .strip()
                )

                for i in range(
                    0,
                    len(answer_text),
                    20,
                ):

                    piece = (
                        answer_text[
                            i:i + 20
                        ]
                    )

                    full_answer += (
                        piece
                    )

                    yield piece

                    await asyncio.sleep(
                        0.01
                    )

                if was_supplemented:

                    suffix = (
                        "\n\n"
                        "(expanded beyond "
                        "your source material)"
                    )

                    full_answer += (
                        suffix
                    )

                    yield suffix

    except HTTPException as e:

        error_msg = (
            f"⚠️ {e.detail}"
        )

        full_answer = (
            error_msg
        )

        yield error_msg

        print(
            "CHAT HTTP ERROR:",
            e.detail,
        )

    except Exception as e:

        error_msg = (
            "⚠️ ScholarAI could not "
            "generate a response right now. "
            "Please try again."
        )

        full_answer = (
            error_msg
        )

        yield error_msg

        print(
            "CHAT ERROR:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

    finally:

        if session_id is not None:

            try:

                db.add_message(
                    user_id,
                    session_id,
                    "user",
                    query,
                )

                if full_answer:

                    db.add_message(
                        user_id,
                        session_id,
                        "assistant",
                        full_answer,
                    )

            except Exception as e:

                print(
                    "WARNING: failed to persist "
                    "chat history:",
                    e,
                )


@app.post(
    "/api/chat"
)
async def chat(
    query: str = Form(...),

    session_id: Optional[int] = Form(
        None
    ),

    user_id: int = Depends(
        auth.get_current_user
    ),
):

    return StreamingResponse(
        response_generator(
            query,
            session_id,
            user_id,
        ),

        media_type=(
            "text/plain; charset=utf-8"
        ),

        headers={
            "Cache-Control":
                "no-cache",

            "Connection":
                "keep-alive",

            "X-Accel-Buffering":
                "no",
        },
    )


# ============================================================
# UPLOAD
# ============================================================

@app.post(
    "/api/upload"
)
async def upload_pdf(
    file: UploadFile = File(...),

    user_id: int = Depends(
        auth.get_current_user
    ),
):

    filename = (
        file.filename or ""
    ).strip()

    if not filename.lower().endswith(
        ".pdf"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Only PDF files are allowed"
            ),
        )

    tmp_file_path = None

    try:

        content = (
            await file.read()
        )

        size_bytes = len(
            content
        )

        if size_bytes == 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "The uploaded PDF is empty."
                ),
            )

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".pdf",
        ) as tmp_file:

            tmp_file.write(
                content
            )

            tmp_file_path = (
                tmp_file.name
            )

        loader = PyPDFLoader(
            tmp_file_path
        )

        documents = (
            loader.load()
        )

        extracted_text = "".join(
            document.page_content
            for document
            in documents
        ).strip()

        if (
            not documents
            or not extracted_text
        ):

            raise HTTPException(
                status_code=422,
                detail=(
                    "Could not extract any "
                    "text from this PDF."
                ),
            )

        basename = filename

        for document in documents:

            document.metadata[
                "source"
            ] = basename

            document.metadata[
                "source_lower"
            ] = basename.lower()

            document.metadata[
                "user_id"
            ] = user_id

        splitter = (
            RecursiveCharacterTextSplitter(
                chunk_size=1500,
                chunk_overlap=250,
            )
        )

        chunks = (
            splitter.split_documents(
                documents
            )
        )

        if not chunks:

            raise HTTPException(
                status_code=422,
                detail=(
                    "No usable text chunks "
                    "were created from this PDF."
                ),
            )

        # add_documents triggers Mistral embeddings.
        await asyncio.to_thread(
            wait_for_mistral_slot
        )

        vectorStore.add_documents(
            chunks
        )

        label = (
            register_source(
                basename
            )
        )

        db.add_source(
            user_id=user_id,
            filename=basename,
            label=label,
            size_bytes=size_bytes,
            chunk_count=len(chunks),
        )

        return {
            "message": (
                f"Successfully processed "
                f"{basename}."
            ),
            "label": label,
            "filename": basename,
            "size_bytes": size_bytes,
            "chunk_count": len(chunks),
        }

    except HTTPException:

        raise

    except Exception as e:

        print(
            "UPLOAD ERROR:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to process the PDF."
            ),
        )

    finally:

        if (
            tmp_file_path
            and os.path.exists(
                tmp_file_path
            )
        ):

            try:

                os.remove(
                    tmp_file_path
                )

            except Exception:

                pass


# ============================================================
# SOURCES
# ============================================================

@app.get(
    "/api/sources"
)
async def get_sources(
    user_id: int = Depends(
        auth.get_current_user
    ),
):

    try:

        return {
            "sources":
                db.list_sources(
                    user_id
                )
        }

    except Exception as e:

        print(
            "ERROR loading sources:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load sources."
            ),
        )


@app.delete(
    "/api/sources/{filename}"
)
async def delete_source_route(
    filename: str,

    user_id: int = Depends(
        auth.get_current_user
    ),
):

    try:

        index.delete(
            filter={
                "$and": [
                    {
                        "user_id": {
                            "$eq":
                                user_id
                        }
                    },
                    {
                        "source_lower": {
                            "$eq":
                                filename.lower()
                        }
                    },
                ]
            }
        )

    except Exception as e:

        print(
            "WARNING: Pinecone delete failed:",
            e,
        )

    try:

        db.delete_source(
            user_id,
            filename,
        )

    except Exception as e:

        print(
            "ERROR deleting source:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to delete source."
            ),
        )

    return {
        "message":
            f"Deleted {filename}"
    }


# ============================================================
# SESSIONS
# ============================================================

@app.get(
    "/api/sessions"
)
async def get_sessions(
    user_id: int = Depends(
        auth.get_current_user
    ),
):

    try:

        return {
            "sessions":
                db.list_sessions(
                    user_id
                )
        }

    except Exception as e:

        print(
            "ERROR loading sessions:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load sessions."
            ),
        )


@app.post(
    "/api/sessions"
)
async def create_session_route(
    title: str = Form(
        "New Chat"
    ),

    user_id: int = Depends(
        auth.get_current_user
    ),
):

    try:

        title = (
            title
            or "New Chat"
        ).strip()

        if not title:
            title = "New Chat"

        session_id = (
            db.create_session(
                user_id,
                title,
            )
        )

        return {
            "id":
                session_id,

            "title":
                title,
        }

    except Exception as e:

        print(
            "ERROR creating session:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to create session: "
                f"{str(e)}"
            ),
        )


@app.delete(
    "/api/sessions/{session_id}"
)
async def delete_session_route(
    session_id: int,

    user_id: int = Depends(
        auth.get_current_user
    ),
):

    try:

        db.delete_session(
            user_id,
            session_id,
        )

    except Exception as e:

        print(
            "ERROR deleting session:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to delete session."
            ),
        )

    return {
        "message":
            f"Deleted session {session_id}"
    }


@app.get(
    "/api/sessions/{session_id}/messages"
)
async def get_session_messages(
    session_id: int,

    user_id: int = Depends(
        auth.get_current_user
    ),
):

    try:

        return {
            "messages":
                db.list_messages(
                    user_id,
                    session_id,
                )
        }

    except Exception as e:

        print(
            "ERROR loading messages:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load messages."
            ),
        )


# ============================================================
# QUIZ
# ============================================================

class QuizAnswer(BaseModel):

    question_id: int

    selected_index: Optional[int]


class QuizSubmitRequest(BaseModel):

    answers: list[QuizAnswer]


@app.post(
    "/api/sessions/{session_id}/quiz"
)
async def generate_quiz_route(
    session_id: int,

    num_questions: int = Form(
        5
    ),

    user_id: int = Depends(
        auth.get_current_user
    ),
):

    num_questions = max(
        1,
        min(
            int(num_questions),
            20,
        ),
    )

    # ========================================================
    # CURRENT CHAT
    # ========================================================

    try:

        messages = db.list_messages(
            user_id,
            session_id,
        )

    except Exception as e:

        print(
            "ERROR loading quiz messages:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load conversation."
            ),
        )

    if not messages:

        raise HTTPException(
            status_code=400,
            detail=(
                "This conversation has no messages "
                "to quiz on yet."
            ),
        )

    chat_transcript = (
        "\n\n".join(
            (
                "Student"
                if message["role"]
                == "user"
                else "ScholarAI"
            )
            + ": "
            + message["content"]
            for message
            in messages
        )
    )

    # ========================================================
    # CURRENT STUDENT PDF CONTENT
    # ========================================================

    user_questions = [
        message["content"]
        for message
        in messages
        if message["role"]
        == "user"
    ]

    pdf_docs = []

    if user_questions:

        combined_query = (
            "\n".join(
                user_questions
            )
        )

        try:

            pdf_docs = (
                get_user_context_docs(
                    combined_query,
                    user_id=user_id,
                    wide=True,
                )
            )

        except Exception as e:

            print(
                "WARNING: quiz PDF retrieval failed:",
                e,
            )

            print(
                traceback.format_exc()
            )

    pdf_chunks = []

    seen_chunks = set()

    for doc in pdf_docs:

        text = (
            doc.page_content
            .strip()
        )

        if not text:
            continue

        fingerprint = hash(
            text
        )

        if fingerprint in seen_chunks:
            continue

        seen_chunks.add(
            fingerprint
        )

        source = (
            doc.metadata.get(
                "source",
                "Uploaded PDF",
            )
        )

        pdf_chunks.append(
            f"[PDF: {source}]\n{text}"
        )

    pdf_context = (
        "\n\n".join(
            pdf_chunks
        )
    )

    if not pdf_context:

        pdf_context = (
            "No relevant PDF material was found "
            "for this current conversation."
        )

    # ========================================================
    # WRONG QUESTIONS
    # ========================================================

    try:

        weak_questions = (
            db.get_weak_quiz_questions(
                user_id,
                session_id,
                limit=num_questions,
            )
        )

    except Exception as e:

        print(
            "WARNING: failed to load weak quiz questions:",
            e,
        )

        weak_questions = []

    # ========================================================
    # PREVIOUS QUESTIONS
    # ========================================================

    try:

        with db.get_conn() as conn:

            rows = conn.execute(
                """
                SELECT DISTINCT
                    qq.question
                FROM quiz_questions qq
                JOIN quiz_attempts qa
                    ON qa.id = qq.attempt_id
                WHERE qa.user_id = ?
                AND qa.session_id = ?
                ORDER BY qq.id DESC
                LIMIT 200
                """,
                (
                    user_id,
                    session_id,
                ),
            ).fetchall()

            previous_questions = [
                row["question"]
                for row in rows
            ]

    except Exception as e:

        print(
            "WARNING: failed to load "
            "previous quiz questions:",
            e,
        )

        previous_questions = []

    # ========================================================
    # NEW QUESTIONS
    # ========================================================

    new_count = max(
        0,
        num_questions
        - len(
            weak_questions
        ),
    )

    generated_new = []

    if new_count > 0:

        try:

            generated_new = (
                generate_quiz(
                    chat_context=
                        chat_transcript,

                    pdf_context=
                        pdf_context,

                    num_questions=
                        new_count,

                    excluded_questions=
                        previous_questions,
                )
            )

        except Exception as e:

            print(
                "QUIZ GENERATION ERROR:",
                str(e),
            )

            print(
                traceback.format_exc()
            )

            if not weak_questions:

                raise HTTPException(
                    status_code=503,
                    detail=(
                        "The AI service is temporarily "
                        "unavailable for quiz generation."
                    ),
                )

    # ========================================================
    # FINAL QUIZ
    # ========================================================

    final_questions = []

    for question in weak_questions:

        if (
            len(final_questions)
            >= num_questions
        ):
            break

        final_questions.append(
            question
        )

    for question in generated_new:

        if (
            len(final_questions)
            >= num_questions
        ):
            break

        if any(
            existing["question"]
            == question["question"]
            for existing
            in final_questions
        ):
            continue

        final_questions.append(
            question
        )

    if not final_questions:

        raise HTTPException(
            status_code=503,
            detail=(
                "Couldn't generate useful quiz questions "
                "from this current chat and its uploaded material."
            ),
        )

    # ========================================================
    # SAVE ATTEMPT
    # ========================================================

    try:

        attempt_id = (
            db.create_quiz_attempt(
                user_id,
                session_id,
            )
        )

        response_questions = []

        for question in final_questions:

            question_id = (
                db.add_quiz_question(
                    attempt_id=
                        attempt_id,

                    fingerprint=
                        question[
                            "fingerprint"
                        ],

                    question=
                        question[
                            "question"
                        ],

                    options_json=
                        json.dumps(
                            question[
                                "options"
                            ]
                        ),

                    correct_index=
                        question[
                            "correct_index"
                        ],

                    explanation=
                        question[
                            "explanation"
                        ],
                )
            )

            response_questions.append(
                {
                    "id":
                        question_id,

                    "question":
                        question[
                            "question"
                        ],

                    "options":
                        question[
                            "options"
                        ],

                    "correct_index":
                        question[
                            "correct_index"
                        ],

                    "explanation":
                        question[
                            "explanation"
                        ],
                }
            )

        return {
            "attempt_id":
                attempt_id,

            "questions":
                response_questions,

            "count":
                len(
                    response_questions
                ),
        }

    except Exception as e:

        print(
            "ERROR saving quiz:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to save generated quiz."
            ),
        )


# ============================================================
# QUIZ SUBMISSION
# ============================================================

@app.post(
    "/api/quiz/{attempt_id}/submit"
)
async def submit_quiz_route(
    attempt_id: int,

    data: QuizSubmitRequest,

    user_id: int = Depends(
        auth.get_current_user
    ),
):

    answers = [
        {
            "question_id":
                answer.question_id,

            "selected_index":
                answer.selected_index,
        }

        for answer
        in data.answers
    ]

    try:

        result = (
            db.submit_quiz_answers(
                user_id=user_id,
                attempt_id=attempt_id,
                answers=answers,
            )
        )

    except ValueError as e:

        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

    except Exception as e:

        print(
            "ERROR submitting quiz:",
            str(e),
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to submit quiz."
            ),
        )

    return result


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )