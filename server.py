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
import base64
import mimetypes


# ============================================================
# RAG IMPORTS
# ============================================================

try:
    from main import (
        llm,
        vision_llm,
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


from langchain_community.document_loaders import PyPDFLoader
from langchain_core.messages import HumanMessage
from langchain_core.documents import Document

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
)


app = FastAPI()


# ============================================================
# VISION OCR RATE-LIMIT PROTECTION
# ============================================================

# Only one OCR request is sent to Mistral at a time.
#
# This is important because the frontend can upload multiple
# images at the same time using Promise.all().
#
# Without this, several Pixtral requests can reach Mistral
# simultaneously and trigger HTTP 429 rate-limit errors.
vision_ocr_semaphore = asyncio.Semaphore(1)


async def call_vision_ocr_with_retry(
    message,
    max_retries: int = 3,
):
    """
    Call Pixtral Vision while handling temporary Mistral
    HTTP 429 rate-limit responses.

    Retry schedule:
        attempt 1 -> wait 1 second
        attempt 2 -> wait 2 seconds
        attempt 3 -> wait 4 seconds

    The semaphore is released while waiting so another
    request does not hold the OCR slot unnecessarily.
    """

    for attempt in range(max_retries + 1):

        try:
            async with vision_ocr_semaphore:

                return await asyncio.to_thread(
                    vision_llm.invoke,
                    [message],
                )

        except Exception as exc:

            error_text = str(exc)

            # Only retry rate-limit errors.
            #
            # Other errors should immediately reach the
            # upload endpoint so the actual problem is visible.
            if (
                "429" not in error_text
                or attempt >= max_retries
            ):
                raise

            wait_seconds = 2 ** attempt

            print(
                f"Mistral OCR rate limited (429). "
                f"Retrying in {wait_seconds}s "
                f"(attempt {attempt + 1}/{max_retries})..."
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


@app.post("/auth/signup")
async def signup(
    data: SignupRequest,
):

    email = data.email.strip().lower()
    password = data.password
    name = data.name.strip()

    if len(password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters.",
        )

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name is required.",
        )

    if db.get_user_by_email(email):
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists.",
        )

    password_hash = auth.hash_password(
        password
    )

    user_id = db.create_user(
        email=email,
        password_hash=password_hash,
        name=name,
    )

    token = auth.create_access_token(
        user_id
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


@app.post("/auth/login")
async def login(
    data: LoginRequest,
):

    email = data.email.strip().lower()
    password = data.password

    user = db.get_user_by_email(
        email
    )

    if (
        not user
        or not auth.verify_password(
            password,
            user["password_hash"],
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    token = auth.create_access_token(
        user["id"]
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


@app.get("/auth/me")
async def me(
    user_id: int = Depends(
        auth.get_current_user
    ),
):

    user = db.get_user_by_id(
        user_id
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User no longer exists.",
        )

    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name"),
    }


# ============================================================
# DATABASE STARTUP
# ============================================================

@app.on_event("startup")
async def on_startup():

    db.init_db()

    print(
        "Database ready at",
        db.DB_PATH,
    )


@app.get("/")
async def root():

    return {
        "status": "ok",
        "message": "ScholarAI backend is running",
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

    # Allows Vercel preview deployments such as:
    #
    # scholarai-citiwcuwt-ayushgoswami12s-projects.vercel.app
    #
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

        docs = get_user_context_docs(
            query,
            user_id=user_id,
            wide=is_repeated_question_query(
                query
            ),
        )

        context = "\n\n".join(
            doc.page_content
            for doc in docs
        )

        new_prompt = prompt.invoke(
            {
                "context": context,
                "question": query,
            }
        )

        first_pass = await llm.ainvoke(
            new_prompt
        )

        answer_text = first_pass.content

        went_out_of_material = (
            SENTINEL.lower()
            in answer_text.lower()
            or not context.strip()
        )

        if went_out_of_material:

            async for fb_chunk in llm.astream(
                fallback_prompt.invoke(
                    {
                        "question": query,
                    }
                )
            ):

                full_answer += fb_chunk.content

                yield fb_chunk.content

                await asyncio.sleep(
                    0.01
                )

            suffix = (
                "\n\n(outside the material)"
            )

            full_answer += suffix

            yield suffix

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

                piece = answer_text[
                    i:i + 20
                ]

                full_answer += piece

                yield piece

                await asyncio.sleep(
                    0.01
                )

            if was_supplemented:

                suffix = (
                    "\n\n"
                    "(expanded beyond your "
                    "source material)"
                )

                full_answer += suffix

                yield suffix

    except Exception as e:

        error_msg = (
            f"⚠️ Error: {str(e)}"
        )

        full_answer += error_msg

        yield error_msg

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

            except Exception:

                print(
                    "Failed to save chat messages:"
                )

                print(
                    traceback.format_exc()
                )


@app.post("/api/chat")
async def chat(
    query: str = Form(...),
    session_id: Optional[int] = Form(None),
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
        media_type="text/event-stream",
    )


# ============================================================
# UPLOAD
# ============================================================

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: int = Depends(
        auth.get_current_user
    ),
):

    """
    Upload and index a PDF or image.

    PDFs:
        PyPDFLoader
            ↓
        extracted text
            ↓
        chunks
            ↓
        Pinecone

    Images:
        Pixtral Vision OCR
            ↓
        extracted text
            ↓
        chunks
            ↓
        Pinecone

    Every indexed document receives user_id metadata
    so each user's knowledge repository stays isolated.
    """

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="A filename is required.",
        )

    basename = os.path.basename(
        file.filename
    )

    extension = os.path.splitext(
        basename
    )[1].lower()

    allowed_images = {
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
    }

    if (
        extension != ".pdf"
        and extension not in allowed_images
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file type. "
                "Upload a PDF, PNG, JPG, "
                "JPEG, or WEBP image."
            ),
        )

    try:

        content = await file.read()

        size_bytes = len(
            content
        )

        if size_bytes == 0:

            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )

        # ========================================================
        # IMAGE OCR
        # ========================================================

        if extension in allowed_images:

            print(
                f"Reading image with Pixtral Vision: "
                f"{basename} "
                f"(user_id={user_id})"
            )

            mime_type = (
                file.content_type
                or mimetypes.guess_type(
                    basename
                )[0]
                or "image/jpeg"
            )

            if mime_type not in {
                "image/png",
                "image/jpeg",
                "image/webp",
            }:

                mime_type = {
                    ".png": "image/png",
                    ".jpg": "image/jpeg",
                    ".jpeg": "image/jpeg",
                    ".webp": "image/webp",
                }.get(
                    extension,
                    "image/jpeg",
                )

            base64_image = (
                base64.b64encode(
                    content
                ).decode("utf-8")
            )

            # ----------------------------------------------------
            # OCR PROMPT
            # ----------------------------------------------------

            message = HumanMessage(
                content=[
                    {
                        "type": "text",
                        "text": (
                            "Carefully extract ALL "
                            "readable text from this image. "
                            "This may be a study note, "
                            "textbook page, exam paper, "
                            "question paper, screenshot, "
                            "diagram with labels, or "
                            "other educational material. "
                            "Preserve headings, question "
                            "numbers, options, formulas, "
                            "symbols, tables, and the "
                            "original logical order as "
                            "accurately as possible. "
                            "Do not summarize or explain "
                            "anything; transcribe the "
                            "content. If there is no "
                            "meaningful readable text, "
                            "reply exactly with "
                            "'NO_TEXT_FOUND'."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": (
                                f"data:{mime_type};"
                                f"base64,{base64_image}"
                            )
                        },
                    },
                ]
            )

            # ----------------------------------------------------
            # PIXTRAL OCR WITH RATE-LIMIT PROTECTION
            # ----------------------------------------------------

            vision_response = (
                await call_vision_ocr_with_retry(
                    message,
                    max_retries=3,
                )
            )

            extracted_text = str(
                vision_response.content
            ).strip()

            # ----------------------------------------------------
            # OCR VALIDATION
            # ----------------------------------------------------

            if (
                not extracted_text
                or (
                    "NO_TEXT_FOUND"
                    in extracted_text.upper()
                )
                or len(extracted_text) < 15
            ):

                raise HTTPException(
                    status_code=422,
                    detail=(
                        "Could not extract meaningful "
                        "text from this image. "
                        "Try a clearer or "
                        "higher-resolution image."
                    ),
                )

            print(
                f"OCR extracted "
                f"{len(extracted_text)} characters "
                f"from '{basename}'"
            )

            # ----------------------------------------------------
            # CREATE LANGCHAIN DOCUMENT
            # ----------------------------------------------------

            document = Document(
                page_content=extracted_text,

                metadata={
                    "source": basename,
                    "source_lower": basename.lower(),
                    "user_id": user_id,
                    "file_type": "image",
                    "ocr": True,
                },
            )

            # ----------------------------------------------------
            # CHUNK OCR TEXT
            # ----------------------------------------------------

            splitter = (
                RecursiveCharacterTextSplitter(
                    chunk_size=1500,
                    chunk_overlap=250,
                )
            )

            chunks = splitter.split_documents(
                [document]
            )

            if not chunks:

                raise HTTPException(
                    status_code=422,
                    detail=(
                        "The image produced no "
                        "indexable text."
                    ),
                )

            # ----------------------------------------------------
            # STORE OCR TEXT IN PINECONE
            # ----------------------------------------------------

            vectorStore.add_documents(
                chunks
            )

            # ----------------------------------------------------
            # STORE SOURCE INFORMATION
            # ----------------------------------------------------

            label = register_source(
                basename
            )

            db.add_source(
                user_id=user_id,
                filename=basename,
                label=label,
                size_bytes=size_bytes,
                chunk_count=len(chunks),
            )

            print(
                f"OCR success: stored "
                f"{len(chunks)} chunks from "
                f"'{basename}'"
            )

            return {
                "message": (
                    f"Successfully extracted "
                    f"and processed {basename}."
                ),
                "label": label,
                "filename": basename,
                "size_bytes": size_bytes,
                "chunk_count": len(chunks),
                "file_type": "image",
                "ocr": True,
            }

        # ========================================================
        # PDF TEXT EXTRACTION
        # ========================================================

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

        try:

            loader = PyPDFLoader(
                tmp_file_path
            )

            documents = loader.load()

        finally:

            if os.path.exists(
                tmp_file_path
            ):

                os.remove(
                    tmp_file_path
                )

        if (
            not documents
            or not "".join(
                document.page_content
                for document in documents
            ).strip()
        ):

            raise HTTPException(
                status_code=422,
                detail=(
                    "Could not extract any "
                    "text from this PDF. "
                    "It may be a scanned/"
                    "image-based PDF."
                ),
            )

        # --------------------------------------------------------
        # ADD METADATA TO PDF DOCUMENTS
        # --------------------------------------------------------

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

            document.metadata[
                "file_type"
            ] = "pdf"

            document.metadata[
                "ocr"
            ] = False

        # --------------------------------------------------------
        # CHUNK PDF
        # --------------------------------------------------------

        splitter = (
            RecursiveCharacterTextSplitter(
                chunk_size=1500,
                chunk_overlap=250,
            )
        )

        chunks = splitter.split_documents(
            documents
        )

        if not chunks:

            raise HTTPException(
                status_code=422,
                detail=(
                    "The PDF produced no "
                    "indexable text."
                ),
            )

        # --------------------------------------------------------
        # STORE PDF IN PINECONE
        # --------------------------------------------------------

        vectorStore.add_documents(
            chunks
        )

        # --------------------------------------------------------
        # REGISTER SOURCE
        # --------------------------------------------------------

        label = register_source(
            basename
        )

        db.add_source(
            user_id=user_id,
            filename=basename,
            label=label,
            size_bytes=size_bytes,
            chunk_count=len(chunks),
        )

        print(
            f"PDF success: stored "
            f"{len(chunks)} chunks from "
            f"'{basename}'"
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
            "file_type": "pdf",
            "ocr": False,
        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            "Upload processing error:"
        )

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to process "
                f"{basename}: {str(e)}"
            ),
        )


# ============================================================
# SOURCES
# ============================================================

@app.get("/api/sources")
async def list_sources(
    user_id: int = Depends(
        auth.get_current_user
    ),
):

    try:

        sources = db.get_sources(
            user_id
        )

        return {
            "sources": sources
        }

    except Exception as e:

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@app.delete("/api/sources/{filename}")
async def delete_source(
    filename: str,
    user_id: int = Depends(
        auth.get_current_user
    ),
):

    try:

        safe_filename = os.path.basename(
            filename
        )

        deleted = db.delete_source(
            user_id,
            safe_filename,
        )

        if not deleted:

            raise HTTPException(
                status_code=404,
                detail="Source not found.",
            )

        # Delete matching vectors from Pinecone.
        #
        # The exact deletion behavior depends on the
        # configured Pinecone index.
        try:

            index.delete(
                filter={
                    "source_lower":
                        safe_filename.lower(),
                    "user_id":
                        user_id,
                }
            )

        except Exception as vector_error:

            print(
                "Pinecone source deletion "
                "warning:",
                vector_error,
            )

        return {
            "message": (
                f"Deleted {safe_filename}"
            )
        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@app.delete("/api/sources")
async def delete_all_sources(
    user_id: int = Depends(
        auth.get_current_user
    ),
):

    try:

        db.delete_all_sources(
            user_id
        )

        try:

            index.delete(
                filter={
                    "user_id": user_id
                }
            )

        except Exception as vector_error:

            print(
                "Pinecone wipe warning:",
                vector_error,
            )

        return {
            "message": (
                "All sources deleted."
            )
        }

    except Exception as e:

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# SESSIONS
# ============================================================

@app.get("/api/sessions")
async def list_sessions(
    user_id: int = Depends(
        auth.get_current_user
    ),
):

    try:

        sessions = db.get_sessions(
            user_id
        )

        return {
            "sessions": sessions
        }

    except Exception as e:

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@app.post("/api/sessions")
async def create_session(
    title: str = Form(...),
    user_id: int = Depends(
        auth.get_current_user
    ),
):

    title = title.strip()

    if not title:

        title = "New Chat"

    try:

        session_id = db.create_session(
            user_id=user_id,
            title=title,
        )

        session = db.get_session(
            user_id,
            session_id,
        )

        return session

    except Exception as e:

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@app.delete("/api/sessions/{session_id}")
async def delete_session(
    session_id: int,
    user_id: int = Depends(
        auth.get_current_user
    ),
):

    try:

        deleted = db.delete_session(
            user_id,
            session_id,
        )

        if not deleted:

            raise HTTPException(
                status_code=404,
                detail="Session not found.",
            )

        return {
            "message": "Session deleted."
        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


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

        session = db.get_session(
            user_id,
            session_id,
        )

        if not session:

            raise HTTPException(
                status_code=404,
                detail="Session not found.",
            )

        messages = db.get_messages(
            user_id,
            session_id,
        )

        return {
            "messages": messages
        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# QUIZ
# ============================================================

@app.post(
    "/api/sessions/{session_id}/quiz"
)
async def create_quiz(
    session_id: int,
    num_questions: int = Form(5),
    user_id: int = Depends(
        auth.get_current_user
    ),
):

    if num_questions < 1:
        num_questions = 1

    if num_questions > 20:
        num_questions = 20

    try:

        session = db.get_session(
            user_id,
            session_id,
        )

        if not session:

            raise HTTPException(
                status_code=404,
                detail="Session not found.",
            )

        messages = db.get_messages(
            user_id,
            session_id,
        )

        if not messages:

            raise HTTPException(
                status_code=400,
                detail=(
                    "This session does not "
                    "contain any messages yet."
                ),
            )

        transcript_parts = []

        for message in messages:

            role = message.get(
                "role",
                "unknown",
            )

            content = message.get(
                "content",
                "",
            )

            transcript_parts.append(
                f"{role.upper()}: {content}"
            )

        transcript = "\n\n".join(
            transcript_parts
        )

        questions = generate_quiz(
            transcript,
            num_questions=num_questions,
        )

        return {
            "questions": questions,
            "count": len(questions),
        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            traceback.format_exc()
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to generate quiz: "
                f"{str(e)}"
            ),
        )