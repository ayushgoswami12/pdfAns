from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import tempfile
import os
import asyncio
import traceback
import sys

# Importing your configured components from main.py
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
        get_filter_for_query,
        get_context_docs,
        register_source,
    )
    print("Successfully imported RAG components from main.py")
except Exception as e:
    print("ERROR importing RAG components:", str(e))
    print(traceback.format_exc())
    sys.exit(1)

import database as db

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

app = FastAPI()


@app.on_event("startup")
async def on_startup():
    db.init_db()
    print("Database ready at", db.DB_PATH)


@app.get("/")
async def root():
    return {"status": "ok", "message": "ScholarAI backend is running"}


# Allow all origins to communicate with this backend (for flexibility with Vercel and other deployments)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def response_generator(query: str, session_id: Optional[int]):
    print(f"Received query: {query}")
    full_answer = ""
    try:
        # --- same retrieval logic as the CLI: doc-scoping + wide search for
        # "most repeated questions" style asks ---
        wide = is_repeated_question_query(query)
        filter_dict = get_filter_for_query(query)

        docs = []
        note = ""
        if filter_dict:
            docs = get_context_docs(query, wide=wide, filter_dict=filter_dict)
            if not docs:
                note = "(Couldn't find that specific document — searched across all material instead.)\n\n"

        if not docs:
            docs = get_context_docs(query, wide=wide)

        print(f"Found {len(docs)} documents")
        context = "\n\n".join([doc.page_content for doc in docs])
        new_prompt = prompt.invoke({"context": context, "question": query})

        # --- DECIDE FIRST, THEN STREAM ---
        print("Generating context-based answer (non-streaming check)...")
        first_pass = await llm.ainvoke(new_prompt)
        answer_text = first_pass.content

        went_out_of_material = (
            SENTINEL.lower() in answer_text.lower() or not context.strip()
        )

        if went_out_of_material:
            print("No answer in material — streaming general-knowledge fallback")
            async for fb_chunk in llm.astream(fallback_prompt.invoke({"question": query})):
                full_answer += fb_chunk.content
                yield fb_chunk.content
                await asyncio.sleep(0.01)
            full_answer += "\n\n(outside the material)"
            yield "\n\n(outside the material)"
            print("Streaming complete")
        else:
            if note:
                full_answer += note
                yield note

            # Context was relevant and used as the foundation, but the
            # model may have supplemented beyond it (e.g. context only had
            # 200 words on the topic, the user asked for 500). Strip the
            # tag before it ever reaches the stream, and append a neutral
            # marker distinct from the full-fallback one — the frontend
            # renders these two very differently (this one isn't a warning,
            # material genuinely was used).
            was_supplemented = SUPPLEMENT_TAG in answer_text
            answer_text = answer_text.replace(SUPPLEMENT_TAG, "").strip()

            chunk_size = 20
            for i in range(0, len(answer_text), chunk_size):
                piece = answer_text[i:i + chunk_size]
                full_answer += piece
                yield piece
                await asyncio.sleep(0.01)

            if was_supplemented:
                suffix = "\n\n(expanded beyond your source material)"
                full_answer += suffix
                yield suffix

            print("Streaming complete")
    except Exception as e:
        print(f"ERROR in response_generator: {str(e)}")
        print(traceback.format_exc())
        error_msg = f"⚠️ Error: {str(e)}"
        full_answer += error_msg
        yield error_msg
    finally:
        # Persist the exchange if this query belongs to a real session.
        # (No session_id -> caller didn't create one first; nothing to save to.)
        if session_id is not None:
            try:
                db.add_message(session_id, "user", query)
                if full_answer:
                    db.add_message(session_id, "assistant", full_answer)
            except Exception as e:
                print(f"WARNING: failed to persist chat history: {e}")


@app.post("/api/chat")
async def chat(query: str = Form(...), session_id: Optional[int] = Form(None)):
    print(f"Received /api/chat request with query: {query} (session_id={session_id})")
    try:
        return StreamingResponse(response_generator(query, session_id), media_type="text/event-stream")
    except Exception as e:
        print(f"ERROR in /api/chat: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    print(f"Received /api/upload request for file: {file.filename}")
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    try:
        content = await file.read()
        size_bytes = len(content)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name

        loader = PyPDFLoader(tmp_file_path)
        documents = loader.load()

        if not documents or not "".join(d.page_content for d in documents).strip():
            os.remove(tmp_file_path)
            raise HTTPException(
                status_code=422,
                detail="Could not extract any text from this PDF. It may be scanned/image-based."
            )

        basename = file.filename
        for d in documents:
            d.metadata["source"] = basename
            d.metadata["source_lower"] = basename.lower()

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=250)
        chunks = text_splitter.split_documents(documents)

        vectorStore.add_documents(chunks)
        os.remove(tmp_file_path)

        label = register_source(basename)
        db.add_source(filename=basename, label=label, size_bytes=size_bytes, chunk_count=len(chunks))

        print(f"Successfully processed {file.filename}")
        return {
            "message": f"Successfully processed {file.filename}.",
            "label": label,
            "filename": basename,
            "size_bytes": size_bytes,
            "chunk_count": len(chunks),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in /api/upload: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sources")
async def get_sources():
    return {"sources": db.list_sources()}


@app.delete("/api/sources/{filename}")
async def delete_source_route(filename: str):
    # NOTE: delete-by-metadata-filter needs a Pinecone serverless index.
    # If yours is pod-based on an older plan this may no-op — check your
    # Pinecone console after deleting to confirm vectors actually cleared.
    # Either way the source disappears from the UI (removed from SQLite).
    try:
        index.delete(filter={"source_lower": {"$eq": filename.lower()}})
    except Exception as e:
        print(f"WARNING: Pinecone delete failed or unsupported on this index: {e}")

    db.delete_source(filename)
    return {"message": f"Deleted {filename}"}


@app.get("/api/sessions")
async def get_sessions():
    return {"sessions": db.list_sessions()}


@app.post("/api/sessions")
async def create_session_route(title: str = Form("New Chat")):
    session_id = db.create_session(title)
    return {"id": session_id, "title": title}


@app.delete("/api/sessions/{session_id}")
async def delete_session_route(session_id: int):
    db.delete_session(session_id)
    return {"message": f"Deleted session {session_id}"}


@app.get("/api/sessions/{session_id}/messages")
async def get_session_messages(session_id: int):
    return {"messages": db.list_messages(session_id)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)