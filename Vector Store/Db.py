# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document 
from dotenv import load_dotenv
from langchain_mistralai import MistralAIEmbeddings


load_dotenv()

# embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")


# embeddings = MistralAIEmbeddings(model="mistral-embed")
docs = [
    Document(page_content="Machine Learning is very powerful and is evolving"),
    Document(page_content="Data Analysis is used in many fields , python is used there. ")
]
embedding_model = MistralAIEmbeddings()

vectorStore = Chroma.from_documents(
    documents=docs ,
    embedding=embedding_model,
    persist_directory="Chrome_db"
)

result = vectorStore.similarity_search("What is used for data analysis ?", k=2) 
#VectorStore is not responsible for answering the questions , VectorStore is responsible for retrieving your information . 

for i in result : 
    print(i.page_content)
    
retriver = vectorStore.as_retriever(
    #by default it follows similarity search 
)
docs = retriver.invoke("Explain deep learning ")

for  d in docs : 
    print(d.page_content) 
