from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.prompts import ChatPromptTemplate
from langchain_mistralai import ChatMistralAI 
from langchain_text_splitters import RecursiveCharacterTextSplitter


load_dotenv()
data = PyPDFLoader("document_loaders/notes.txt")
docs = data.load()



template = ChatPromptTemplate.from_messages(
    [
        ('system','you are AI summarise the text'),
        ("human","{data}")
    ]
)


prompt = template.format_messages(data=docs[0].page_content)

splitter = RecursiveCharacterTextSplitter(
    chunk_size = 1000 , 
    chunk_overlap = 200
)
#you need split document 
chunks = splitter.split_documents(docs)

# data = TextLoader("document_loaders/notes.txt")
model = ChatMistralAI(model= 'mistral-small-2506')

chat = model.invoke(prompt)
print(chat.content)