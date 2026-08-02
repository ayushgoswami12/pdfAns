import os
import re
import base64
from dotenv import load_dotenv
from langchain_mistralai import MistralAIEmbeddings, ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore as PineconeStore
from pinecone import Pinecone

# NOTE: PDF ingestion needs `pypdf` installed (pip install pypdf) for
# langchain_community's PyPDFLoader to work.
from langchain_community.document_loaders import PyPDFLoader

load_dotenv()

embedding_model = MistralAIEmbeddings()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))

vectorStore = PineconeStore(
    index=index,
    embedding=embedding_model,
    text_key="text"
)

# INCREASED K: To find "repeated questions" across multiple papers,
# the LLM needs to see more chunks at once.
retriver = vectorStore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 8,           # Increased from 4 to fetch more context across papers
        "fetch_k": 20,    # Increased from 10
        "lambda_mult": 0.5,
    }
)

# A wider retriever specifically for "most repeated questions" style
# queries, where the LLM needs to see as many previous-year papers as
# possible rather than just the most semantically similar chunks.
repeated_q_retriver = vectorStore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 20,
        "fetch_k": 40,
        "lambda_mult": 0.3,   # lower lambda -> favor diversity across papers
    }
)

# Standard LLM for answering questions
llm = ChatMistralAI(model="mistral-small-2506")

# Vision LLM specifically for reading exam papers
vision_llm = ChatMistralAI(model="pixtral-12b-2409")

SENTINEL = "Could not find the answer in the provided material"

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an AI assistant. USE ONLY the provided context to answer the question. "
                "If the user asks for patterns like 'most repeated questions', analyze the context "
                "carefully to find duplicates or near-duplicate questions across the different "
                "papers, and list them with how many papers/years they appeared in. If the user asks "
                "to extract questions from a specific chapter or section, pull out every matching "
                "question you can find in the context, in order. "
                f"If you couldn't find the answer say '{SENTINEL}'."),
    ("human", "Context: {context}\n\nQuestion: {question}")
])

# Fallback prompt used when the context genuinely has nothing relevant.
# This lets the assistant still answer from its own general knowledge,
# clearly labelled so the student knows it isn't sourced from their papers.
fallback_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful study assistant. The user's question could not be answered "
                "from their uploaded exam papers/material. Answer it as best you can using your "
                "own general knowledge. Be concise and accurate."),
    ("human", "Question: {question}")
])

# Keywords that signal the user wants a "repeated question" style
# analysis across papers, so we can widen retrieval automatically.
REPEATED_Q_KEYWORDS = [
    "repeated question", "repeated questions", "most repeated",
    "most asked", "frequently asked", "common question", "common questions",
    "important question", "important questions", "which question",
    "recurring question", "pattern of question"
]

# --- Per-document referencing -------------------------------------------
# Lets a student say things like:
#   "in pdf1 extract all questions from chapter 5"
#   "extract all questions from chapter 5 in syllabus.pdf"
# and have retrieval scoped to just that one uploaded document.
label_to_source = {}   # e.g. {"pdf1": "2022_paper.pdf", "paper1": "2022_paper.pdf"}
doc_counter = 0


def register_source(basename: str) -> str:
    """Assigns a short label (pdf1, pdf2, ...) to a newly ingested file so
    it can be referenced later, and returns that label."""
    global doc_counter
    doc_counter += 1
    label = f"pdf{doc_counter}"
    label_to_source[label] = basename
    label_to_source[f"paper{doc_counter}"] = basename
    return label


def get_filter_for_query(query: str):
    """Looks for an explicit filename or a pdf1/paper2-style label in the
    query and returns a Pinecone metadata filter scoped to that document,
    or None if no specific document was referenced."""
    q_lower = query.lower()

    # 1. Explicit filename, e.g. "syllabus.pdf" or "paper_2023.jpg"
    m = re.search(r'(\S+\.(?:pdf|png|jpg|jpeg))', q_lower)
    if m:
        filename = m.group(1)
        return {"source_lower": {"$eq": filename}}

    # 2. Short label, e.g. "pdf1" or "paper 2"
    m2 = re.search(r'\b(pdf|paper)\s?(\d+)\b', q_lower)
    if m2:
        label = f"{m2.group(1)}{m2.group(2)}"
        if label in label_to_source:
            return {"source_lower": {"$eq": label_to_source[label].lower()}}

    return None


def is_repeated_question_query(query: str) -> bool:
    q = query.lower()
    return any(kw in q for kw in REPEATED_Q_KEYWORDS)


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


def get_context_docs(query: str, wide: bool = False, filter_dict=None):
    if filter_dict:
        k = 15
        try:
            return vectorStore.similarity_search(query, k=k, filter=filter_dict)
        except Exception as e:
            print(f"(Filtered search failed, falling back to full search: {e})")
            return []
    active_retriver = repeated_q_retriver if wide else retriver
    return active_retriver.invoke(query)


def answer_query(query: str) -> str:
    """Runs the RAG pipeline for a query. Handles:
    - scoping to one document if the user names it (filename or pdf1/paper2 label)
    - widening retrieval for 'most repeated questions' style asks
    - falling back to a clearly-labelled general-knowledge answer when
      nothing relevant is in the uploaded material
    """
    wide = is_repeated_question_query(query)
    filter_dict = get_filter_for_query(query)

    note = ""
    docs = []
    if filter_dict:
        docs = get_context_docs(query, wide=wide, filter_dict=filter_dict)
        if not docs:
            note = "(Couldn't find that specific document — searched across all material instead.)\n\n"

    if not docs:
        docs = get_context_docs(query, wide=wide)

    context = "\n\n".join([doc.page_content for doc in docs])

    new_prompt = prompt.invoke({"context": context, "question": query})
    response = llm.invoke(new_prompt)
    answer = response.content

    # If the model says it's not in the material, fall back to a
    # general-knowledge answer instead of just returning the sentinel.
    if SENTINEL in answer or not context.strip():
        fb_prompt = fallback_prompt.invoke({"question": query})
        fb_response = llm.invoke(fb_prompt)
        return f"{fb_response.content}\n\n(material needed )"

    return f"{note}{answer}"


print("RAG System Created")
print("Press 0 to exit")
print("Tip: Enter an image path (e.g., paper_2023.jpg) or a .pdf path to extract and store it!")
print("Tip: Ask 'give me the most repeated questions' to analyze patterns across all papers!")
print("Tip: Reference a specific paper with its label (e.g. 'in pdf1, ...') or filename (e.g. 'in syllabus.pdf, ...')")

if __name__ == "__main__":
    while True:
        query = input("You: ")
        if query == "0":
            break

        # --- PDF ingestion ---------------------------------------------
        if os.path.isfile(query) and query.lower().endswith('.pdf'):
            print("Reading PDF...")
            try:
                basename = os.path.basename(query)
                loader = PyPDFLoader(query)
                pages = loader.load()  # one Document per page, with page metadata

                if not pages or not "".join(p.page_content for p in pages).strip():
                    print("\nSystem: Could not extract any text from this PDF. It may be scanned/image-based — "
                          "try converting its pages to images and uploading those instead.")
                    continue

                for p in pages:
                    p.metadata["source"] = basename
                    p.metadata["source_lower"] = basename.lower()

                splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
                split_docs = splitter.split_documents(pages)

                vectorStore.add_documents(split_docs)
                label = register_source(basename)
                print(f"Success! Stored {len(split_docs)} chunks from '{basename}'. "
                      f"You can refer to it later as '{label}' or by its filename.")
            except Exception as e:
                print(f"Error processing PDF: {e}")
            continue
        # --------------------------------------------------------------

        # --- Smart Vision Extraction & Vector Ingestion -----------------
        if os.path.isfile(query) and query.lower().endswith(('.png', '.jpg', '.jpeg')):
            print("Reading exam paper with Pixtral Vision...")
            try:
                basename = os.path.basename(query)
                base64_image = encode_image(query)

                # Ask Pixtral to transcribe the exam paper cleanly
                message = HumanMessage(
                    content=[
                        {"type": "text", "text": "Carefully extract all text, questions, formulas, and options from this exam paper. Keep the question numbers and formatting intact. If this image is not a document or contains no readable text, reply exactly with 'NO_TEXT_FOUND'."},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        },
                    ]
                )

                vision_response = vision_llm.invoke([message])
                extracted_text = vision_response.content

                # Guardrail against unreadable/invalid images
                if "NO_TEXT_FOUND" in extracted_text or len(extracted_text.strip()) < 15:
                    print("\nSystem: Could not extract meaningful text or questions from this image. It may be too blurry or not a document.")
                    continue

                # Wrap the clean text in a Langchain Document object
                doc = Document(
                    page_content=extracted_text,
                    metadata={"source": basename, "source_lower": basename.lower()}
                )

                # Chunk and add to Pinecone
                splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
                split_docs = splitter.split_documents([doc])

                vectorStore.add_documents(split_docs)
                label = register_source(basename)
                print(f"Success! Extracted and stored {len(split_docs)} chunks from '{basename}'. "
                      f"You can refer to it later as '{label}' or by its filename.")
            except Exception as e:
                print(f"Error processing image: {e}")
            continue
        # -----------------------------------------------------------------

        # RAG Query Logic (document scoping + repeated-question widening + fallback)
        answer = answer_query(query)
        print(f"\nAI: {answer}")