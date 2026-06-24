from langchain_community.retrievers import ArxivRetriever

retriever = ArxivRetriever(
    load_max_docs=2,
    load_all_available_meta=True
)
docs = retriever.invoke("large language models")
print(docs)
for i,doc in enumerate(docs):
    print(f"\n Result {i+1}")
    