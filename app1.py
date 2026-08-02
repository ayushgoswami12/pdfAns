# from fastapi import FastAPI, UploadFile, File, Form, HTTPException
# from fastapi.responses import StreamingResponse
# from fastapi.middleware.cors import CORSMiddleware
# import tempfile
# import os
# import asyncio
# import traceback
# import sys

# # Importing your configured components from main.py
# try:
#     from main import (
#         llm,
#         prompt,
#         fallback_prompt,
#         vectorStore,
#         SENTINEL,
#         is_repeated_question_query,
#         get_filter_for_query,
#         get_context_docs,
#         register_source,
#     )
#     print("Successfully imported RAG components from main.py")
# except Exception as e:
#     print("ERROR importing RAG components:", str(e))
#     print(traceback.format_exc())
#     sys.exit(1)

# from langchain_community.document_loaders import PyPDFLoader
# from langchain_text_splitters import RecursiveCharacterTextSplitter

# app = FastAPI()

# @app.get("/")
# async def root():
#     return {"status": "ok", "message": "ScholarAI backend is running"}

# # Allow all origins to communicate with this backend (for flexibility with Vercel and other deployments)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# async def response_generator(query: str):
#     print(f"Received query: {query}")
#     try:
#         # --- same retrieval logic as the CLI: doc-scoping + wide search for
#         # "most repeated questions" style asks ---
#         wide = is_repeated_question_query(query)
#         filter_dict = get_filter_for_query(query)

#         docs = []
#         note = ""
#         if filter_dict:
#             docs = get_context_docs(query, wide=wide, filter_dict=filter_dict)
#             if not docs:
#                 note = "(Couldn't find that specific document — searched across all material instead.)\n\n"

#         if not docs:
#             docs = get_context_docs(query, wide=wide)

#         print(f"Found {len(docs)} documents")
#         context = "\n\n".join([doc.page_content for doc in docs])
#         new_prompt = prompt.invoke({"context": context, "question": query})

#         # --- DECIDE FIRST, THEN STREAM ---
#         # Generate the context-based answer in one non-streaming call so we
#         # can reliably check for the SENTINEL before anything reaches the
#         # client. This trades a bit of time-to-first-token for correctness:
#         # the raw "Could not find..." sentinel can never leak to the user.
#         print("Generating context-based answer (non-streaming check)...")
#         first_pass = await llm.ainvoke(new_prompt)
#         answer_text = first_pass.content

#         went_out_of_material = (
#             SENTINEL.lower() in answer_text.lower() or not context.strip()
#         )

#         if went_out_of_material:
#             print("No answer in material — streaming general-knowledge fallback")
#             async for fb_chunk in llm.astream(fallback_prompt.invoke({"question": query})):
#                 yield fb_chunk.content
#                 await asyncio.sleep(0.01)
#             yield "\n\n(outside the material)"
#             print("Streaming complete")
#             return

#         if note:
#             yield note

#         # Simulate a typing effect for the already-generated in-context
#         # answer (kept small so it still feels real-time on the frontend).
#         chunk_size = 20
#         for i in range(0, len(answer_text), chunk_size):
#             yield answer_text[i:i + chunk_size]
#             await asyncio.sleep(0.01)

#         print("Streaming complete")
#     except Exception as e:
#         print(f"ERROR in response_generator: {str(e)}")
#         print(traceback.format_exc())
#         yield f"⚠️ Error: {str(e)}"

# @app.post("/api/chat")
# async def chat(query: str = Form(...)):
#     print(f"Received /api/chat request with query: {query}")
#     try:
#         return StreamingResponse(response_generator(query), media_type="text/event-stream")
#     except Exception as e:
#         print(f"ERROR in /api/chat: {str(e)}")
#         print(traceback.format_exc())
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/api/upload")
# async def upload_pdf(file: UploadFile = File(...)):
#     print(f"Received /api/upload request for file: {file.filename}")
#     if not file.filename.endswith('.pdf'):
#         raise HTTPException(status_code=400, detail="Only PDF files are allowed")

#     try:
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
#             content = await file.read()
#             tmp_file.write(content)
#             tmp_file_path = tmp_file.name

#         loader = PyPDFLoader(tmp_file_path)
#         documents = loader.load()

#         if not documents or not "".join(d.page_content for d in documents).strip():
#             os.remove(tmp_file_path)
#             raise HTTPException(
#                 status_code=422,
#                 detail="Could not extract any text from this PDF. It may be scanned/image-based."
#             )

#         # Tag each chunk with the real filename (not the temp path) so it
#         # can be referenced later by name, e.g. "in syllabus.pdf ..."
#         basename = file.filename
#         for d in documents:
#             d.metadata["source"] = basename
#             d.metadata["source_lower"] = basename.lower()

#         text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=250)
#         chunks = text_splitter.split_documents(documents)

#         vectorStore.add_documents(chunks)
#         os.remove(tmp_file_path)

#         label = register_source(basename)

#         print(f"Successfully processed {file.filename}")
#         return {
#             "message": f"Successfully processed {file.filename}.",
#             "label": label,
#         }
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"ERROR in /api/upload: {str(e)}")
#         print(traceback.format_exc())
#         raise HTTPException(status_code=500, detail=str(e))

# if __name__ == "__main__":
#     import uvicorn

#     uvicorn.run(app, host="0.0.0.0", port=8000)