# from langchain_huggingface import HuggingFaceEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document 
from dotenv import load_dotenv
from langchain_mistralai import MistralAIEmbeddings


load_dotenv()

# embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")


# embeddings = MistralAIEmbeddings(model="mistral-embed")
docs = [
    Document(page_content="Machine Learning is very powerful and is evolving")
]
embedding_model = MistralAIEmbeddings()

vectorStore = Chroma.from_documents(
    documents=docs ,
    embedding=embedding_model
)