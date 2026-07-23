from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import asyncio
import traceback
import sys

# Importing your configured components from main.py
try:
    from main import retriver, llm, prompt, vectorStore
    print("Successfully imported RAG components from main.py")
except Exception as e:
    print("ERROR importing RAG components:", str(e))
    print(traceback.format_exc())
    sys.exit(1)

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

app = FastAPI()

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

async def response_generator(query: str):
    print(f"Received query: {query}")
    try:
        # Local MMR Vector search
        docs = retriver.invoke(query)
        print(f"Found {len(docs)} documents")
        context = "\n\n".join([doc.page_content for doc in docs])
        new_prompt = prompt.invoke({"context": context, "question": query})
        
        # Real-time streaming chunks from Mistral AI
        print("Starting LLM streaming")
        async for chunk in llm.astream(new_prompt):
            yield chunk.content
            await asyncio.sleep(0.01)
        print("Streaming complete")
    except Exception as e:
        print(f"ERROR in response_generator: {str(e)}")
        print(traceback.format_exc())
        yield f"⚠️ Error: {str(e)}"

@app.post("/api/chat")
async def chat(query: str = Form(...)):
    print(f"Received /api/chat request with query: {query}")
    try:
        return StreamingResponse(response_generator(query), media_type="text/event-stream")
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
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
            
        loader = PyPDFLoader(tmp_file_path)
        documents = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=250)
        chunks = text_splitter.split_documents(documents)
        
        vectorStore.add_documents(chunks)
        os.remove(tmp_file_path)
        
        print(f"Successfully processed {file.filename}")
        return {"message": f"Successfully processed {file.filename}."}
    except Exception as e:
        print(f"ERROR in /api/upload: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000 )