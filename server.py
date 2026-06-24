from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import asyncio

# Importing your configured components from main.py
from main import retriver, llm, prompt, vectorStore
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

app = FastAPI()

# Allow both localhost and network IP to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://192.168.167.133:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def response_generator(query: str):
    try:
        # Local MMR Vector search
        docs = retriver.invoke(query)
        context = "\n\n".join([doc.page_content for doc in docs])
        new_prompt = prompt.invoke({"context": context, "question": query})
        
        # Real-time streaming chunks from Mistral AI
        async for chunk in llm.astream(new_prompt):
            yield chunk.content
            await asyncio.sleep(0.01)
    except Exception as e:
        yield f"⚠️ Error: {str(e)}"

@app.post("/api/chat")
async def chat(query: str = Form(...)):
    return StreamingResponse(response_generator(query), media_type="text/event-stream")

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
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
        
        return {"message": f"Successfully processed {file.filename}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    reload=True
    uvicorn.run(app, host="0.0.0.0", port=8000 ,reload=True)