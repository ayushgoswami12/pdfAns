from langchain_community.retrievers import ArxivRetriever

retriever = ArxivRetriever(
    load_max_docs=2,
    load_all_available_meta=True
)
docs = retriever.invoke("large language models")

for i, doc in enumerate(docs):
    print(f"\nResult {i+1}")
    print("Title:", doc.metadata.get("Title"))
    print("Authors:", doc.metadata.get("Authors"))
    print("Published:", doc.metadata.get("Published"))
    print("Entry ID:", doc.metadata.get("Entry ID"))
    print("Summary:", doc.page_content[:200])