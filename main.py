from dotenv import load_dotenv
from langchain_mistralai import MistralAIEmbeddings
# from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.prompts import ChatPromptTemplate
from langchain_mistralai import ChatMistralAI 
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma

load_dotenv()

embedding_model = MistralAIEmbeddings()
vectorStore = Chroma(
    persist_directory="ChromaDB" , 
    embedding_function=embedding_model
)


retriver = vectorStore.as_retriever(
    search_type = "mmr",
    search_kwargs = {
        "k":4 ,
        'fetch_k' : 10 , #first it will fetch 10 embeddings then 4 
        "lambda_mult" : 0.5 , #0 => more diverse , 1 => less diverse 
    }
)

llm = ChatMistralAI(model= "mistral-small-2506")


prompt = ChatPromptTemplate.from_messages([
    ("system","You are AI assistant , USE ONLY the provided answer the question. and if you coudnt find the answer then try to find it in the interet (saying was not from the material so it has been taken from internet )' "),
    ("human",'''
     Context : {context} Question : {question}
     ''')
    
])

print("Rag System Created ")
print("Press 0 to exit ")

if __name__ == "__main__":
    while True: 
        query = input("You  : ")
        if query == "0": 
            break 
        docs = retriver.invoke(query)
        
        context ="\n\n".join(
            [doc.page_content for doc in docs]
        ) 
        new_prompt = prompt.invoke(
            {
                "context": context , 
                "question" : query
            }
        )
        
        response = llm.invoke(new_prompt)
        print(f"\n AI: {response.content}")