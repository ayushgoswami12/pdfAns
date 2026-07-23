from dotenv import load_dotenv
from langchain_mistralai import MistralAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.prompts import ChatPromptTemplate
from langchain_mistralai import ChatMistralAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore
import os

load_dotenv()

embedding_model = MistralAIEmbeddings()

vectorStore = PineconeVectorStore(
    index_name=os.getenv("PINECONE_INDEX_NAME"),
    embedding=embedding_model,
)

retriver = vectorStore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 4,
        "fetch_k": 10,
        "lambda_mult": 0.5,
    }
)

llm = ChatMistralAI(model="mistral-small-2506")

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are AI assistant, USE ONLY the provided context to answer the question. If you couldn't find the answer say 'could not find the answer in the provided material'."),
    ("human", "Context : {context} Question : {question}")
])

print("Rag System Created")
print("Press 0 to exit")

if __name__ == "__main__":
    while True:
        query = input("You: ")
        if query == "0":
            break
        docs = retriver.invoke(query)
        context = "\n\n".join([doc.page_content for doc in docs])
        new_prompt = prompt.invoke({"context": context, "question": query})
        response = llm.invoke(new_prompt)
        print(f"\n AI: {response.content}")