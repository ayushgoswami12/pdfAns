import os
from dotenv import load_dotenv
from langchain_mistralai import MistralAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore as PineconeStore
from pinecone import Pinecone

load_dotenv()

# Initialize Pinecone and components
embedding_model = MistralAIEmbeddings()
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))
vectorStore = PineconeStore(
    index=index,
    embedding=embedding_model,
    text_key="text"
)

# Load the PDF
pdf_path = "document_loaders/Machine Learning.pdf"
print(f"Loading PDF from {pdf_path}")
loader = PyPDFLoader(pdf_path)
documents = loader.load()
print(f"Loaded {len(documents)} pages from PDF")

# Split into chunks
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=250)
chunks = text_splitter.split_documents(documents)
print(f"Split into {len(chunks)} chunks")

# Add to Pinecone
print("Adding chunks to Pinecone...")
vectorStore.add_documents(chunks)
print("Successfully added PDF to Pinecone index!")
