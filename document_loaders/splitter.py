from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader

data = TextLoader("document_loaders/notes.txt")

splitter = RecursiveCharacterTextSplitter(
    # separator="",
    chunk_size = 10,
    chunk_overlap=2,
)
docs = data.load()
chunks = splitter.split_documents(docs)
print(chunks)

print(len(chunks))

for i in chunks : 
    print(i.page_content)