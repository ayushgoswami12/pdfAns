#load the pdf 
#split into chunks
#create the embeddings 
#store the chroma 
from langchain_community.document_loaders import PyPDFLoader
from dotenv import load_dotenv 
from langchain_chroma import Chroma

from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_core.prompts import PromptTemplate
# from langchain_mistralai import ChatMistralAI 
from langchain_mistralai import MistralAIEmbeddings

load_dotenv()




docs = PyPDFLoader("document_loaders/Machine Learning.pdf")
data = docs.load()

splitter = RecursiveCharacterTextSplitter(
    chunk_size = 1000 ,
    chunk_overlap = 200 
)

chunks = splitter.split_documents(data)

embeddings_model = MistralAIEmbeddings()
vectorStore = Chroma.from_documents(
    documents=chunks , #because 
    embedding=embeddings_model,
    persist_directory="ChromaDB"
)



# templates = PromptTemplate(
#     [
#         ("system ", "you are an AI who will asnewr the question as per asked .")
#         ("human ", "{data}")
#     ]
# )

# prompt = templates.format_messages(data=docs[0].page_content)
# model = ChatMistralAI(model= 'mistral-small-2506')

# chat = model.invoke(prompt)
# print(chat.content)