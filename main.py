from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader
from langchain_core.prompts import ChatPromptTemplate
from langchain_mistralai import ChatMistralAI 

load_dotenv()
data = TextLoader("document_loaders/notes.txt")
docs = data.load()



template = ChatPromptTemplate.from_messages(
    [
        ('system','you are AI summarise the text'),
        ("human","{data}")
    ]
)

prompt = template.format_messages(data=docs[0].page_content)

# data = TextLoader("document_loaders/notes.txt")
model = ChatMistralAI(model= 'mistral-small-2506')

chat = model.invoke(prompt)
print(chat.content)