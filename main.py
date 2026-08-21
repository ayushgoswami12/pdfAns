# FILE: main.py

import os
import re
import json
import base64
import hashlib

from dotenv import load_dotenv

from langchain_mistralai import (
    MistralAIEmbeddings,
    ChatMistralAI,
)

from langchain_core.prompts import ChatPromptTemplate

from langchain_core.messages import HumanMessage

from langchain_core.documents import Document

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
)

from langchain_pinecone import (
    PineconeVectorStore as PineconeStore,
)

from pinecone import Pinecone

from langchain_community.document_loaders import (
    PyPDFLoader,
)


load_dotenv()


# ============================================================
# VECTOR STORE
# ============================================================

embedding_model = MistralAIEmbeddings()

pc = Pinecone(
    api_key=os.getenv("PINECONE_API_KEY")
)

index = pc.Index(
    os.getenv("PINECONE_INDEX_NAME")
)

vectorStore = PineconeStore(
    index=index,
    embedding=embedding_model,
    text_key="text",
)


retriver = vectorStore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 8,
        "fetch_k": 20,
        "lambda_mult": 0.5,
    },
)


repeated_q_retriver = vectorStore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 20,
        "fetch_k": 40,
        "lambda_mult": 0.3,
    },
)


# ============================================================
# MODELS
# ============================================================

llm = ChatMistralAI(
    model="mistral-small-2506"
)

vision_llm = ChatMistralAI(
    model="pixtral-12b-2409"
)


SENTINEL = (
    "Could not find the answer in the provided material"
)

SUPPLEMENT_TAG = "[[SUPPLEMENTED]]"


# ============================================================
# NORMAL CHAT PROMPTS
# ============================================================

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are ScholarAI.

Answer the student's question using the supplied document
context as the primary source of truth.

Rules:
1. Use the supplied context first.
2. If the context only partially answers the question, you may
   supplement with accurate general knowledge.
3. If there is no relevant document context, say exactly:
   "Could not find the answer in the provided material"
4. Do not claim that something is in the student's material
   unless it is supported by the supplied context.
5. Be clear and useful for a student.
""",
        ),
        (
            "human",
            "Context:\n{context}\n\nQuestion:\n{question}",
        ),
    ]
)


fallback_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are ScholarAI.

The student's uploaded material did not contain enough
information to answer the question.

Answer using general knowledge and do not pretend that the
answer came from the student's uploaded material.
""",
        ),
        (
            "human",
            "Question:\n{question}",
        ),
    ]
)


# ============================================================
# DOCUMENT REFERENCES
# ============================================================

REPEATED_Q_KEYWORDS = [
    "repeated question",
    "repeated questions",
    "most repeated",
    "most asked",
    "frequently asked",
    "common question",
    "common questions",
    "important question",
    "important questions",
    "which question",
    "recurring question",
    "pattern of question",
]


label_to_source = {}
doc_counter = 0


def register_source(basename: str) -> str:
    global doc_counter

    doc_counter += 1

    label = f"pdf{doc_counter}"

    label_to_source[label] = basename
    label_to_source[f"paper{doc_counter}"] = basename

    return label


def get_filter_for_query(query: str):
    q_lower = query.lower()

    known_filenames = sorted(
        set(label_to_source.values()),
        key=len,
        reverse=True,
    )

    for filename in known_filenames:

        if filename.lower() in q_lower:
            return {
                "source_lower": {
                    "$eq": filename.lower()
                }
            }

    match = re.search(
        r"\b(pdf|paper)\s?(\d+)\b",
        q_lower,
    )

    if match:

        label = (
            f"{match.group(1)}"
            f"{match.group(2)}"
        )

        if label in label_to_source:

            return {
                "source_lower": {
                    "$eq": label_to_source[label].lower()
                }
            }

    return None


def is_repeated_question_query(
    query: str,
) -> bool:

    q = query.lower()

    return any(
        keyword in q
        for keyword in REPEATED_Q_KEYWORDS
    )


def encode_image(image_path):
    with open(
        image_path,
        "rb",
    ) as image_file:

        return base64.b64encode(
            image_file.read()
        ).decode("utf-8")


# ============================================================
# USER-SCOPED VECTOR RETRIEVAL
# ============================================================

def get_user_context_docs(
    query: str,
    user_id: int,
    wide: bool = False,
):
    """
    Retrieve ONLY the authenticated user's vectors.

    Every uploaded PDF chunk receives user_id metadata.
    """

    user_filter = {
        "user_id": {
            "$eq": user_id
        }
    }

    try:

        return vectorStore.similarity_search(
            query,
            k=20 if wide else 12,
            filter=user_filter,
        )

    except Exception as e:

        print(
            "User-filtered Pinecone search failed:",
            e,
        )

        return []


# ============================================================
# QUIZ PROMPT
# ============================================================

quiz_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are ScholarAI's quiz generator.

Create a multiple-choice quiz using ONLY these sources:

1. CURRENT CHAT
2. CURRENT STUDENT'S UPLOADED PDF MATERIAL

STRICT RULES:

1. Do not use general world knowledge.
2. Do not use previous chat sessions.
3. Use only the current session supplied in CURRENT CHAT.
4. Use only PDF content supplied in CURRENT STUDENT PDF MATERIAL.
5. Every question must be supported by either the current chat
   or the supplied PDF material.
6. The current chat and PDF material belong to the same student.
7. If the PDF has useful information that was not discussed in
   the chat, that PDF information may be tested.
8. If the current chat discusses something not present in the
   PDF, that current-chat information may be tested.
9. If both sources discuss the same concept, you may test it.
10. Cover different concepts.
11. Avoid questions that are effectively duplicates.
12. Each question must have exactly 4 options.
13. Exactly one option must be correct.
14. correct_index must be 0, 1, 2, or 3.
15. Give a concise explanation.
16. Return ONLY valid JSON.
17. Do not use markdown code fences.
18. Do not add commentary before or after JSON.

Requested number:
{num_questions}

Previously asked questions:
{excluded_questions}

CURRENT CHAT:
{chat_context}

CURRENT STUDENT PDF MATERIAL:
{pdf_context}
""",
        ),
        (
            "human",
            "Generate the quiz now.",
        ),
    ]
)


def _quiz_fingerprint(
    question: str,
) -> str:

    normalized = re.sub(
        r"\s+",
        " ",
        question.lower().strip(),
    )

    return hashlib.sha256(
        normalized.encode("utf-8")
    ).hexdigest()


def _clean_quiz_json(
    raw: str,
) -> list[dict]:

    raw = raw.strip()

    if raw.startswith("```"):

        raw = raw.replace(
            "```json",
            "",
            1,
        )

        raw = raw.replace(
            "```",
            "",
        )

        raw = raw.strip()

    try:

        parsed = json.loads(raw)

    except json.JSONDecodeError as e:

        raise ValueError(
            f"Model did not return valid JSON: {e}"
        )

    if not isinstance(parsed, list):

        raise ValueError(
            "Quiz result must be a JSON array."
        )

    result = []

    for item in parsed:

        if not isinstance(item, dict):
            continue

        required = {
            "question",
            "options",
            "correct_index",
            "explanation",
        }

        if not required.issubset(item.keys()):
            continue

        question = item["question"]
        options = item["options"]
        correct_index = item["correct_index"]
        explanation = item["explanation"]

        if not isinstance(question, str):
            continue

        if not isinstance(options, list):
            continue

        if len(options) != 4:
            continue

        if not all(
            isinstance(option, str)
            for option in options
        ):
            continue

        if not isinstance(correct_index, int):
            continue

        if not 0 <= correct_index <= 3:
            continue

        if not isinstance(explanation, str):
            continue

        result.append(
            {
                "question": question.strip(),
                "options": options,
                "correct_index": correct_index,
                "explanation": explanation.strip(),
            }
        )

    return result


def generate_quiz(
    chat_context: str,
    pdf_context: str,
    num_questions: int = 5,
    excluded_questions: list[str] | None = None,
) -> list[dict]:

    num_questions = max(
        1,
        min(
            int(num_questions),
            20,
        ),
    )

    excluded_questions = (
        excluded_questions or []
    )

    excluded_fingerprints = {
        _quiz_fingerprint(question)
        for question in excluded_questions
    }

    generated = []

    attempts = 0

    while (
        len(generated) < num_questions
        and attempts < 5
    ):

        attempts += 1

        remaining = (
            num_questions - len(generated)
        )

        previous_questions = (
            excluded_questions
            + [
                item["question"]
                for item in generated
            ]
        )

        previous_questions = previous_questions[-100:]

        excluded_text = (
            "\n".join(
                f"- {question}"
                for question in previous_questions
            )
            if previous_questions
            else "None"
        )

        filled_prompt = quiz_prompt.invoke(
            {
                "num_questions": remaining,
                "excluded_questions": excluded_text,
                "chat_context": chat_context,
                "pdf_context": pdf_context,
            }
        )

        response = llm.invoke(
            filled_prompt
        )

        candidates = _clean_quiz_json(
            response.content
        )

        for candidate in candidates:

            fingerprint = _quiz_fingerprint(
                candidate["question"]
            )

            if fingerprint in excluded_fingerprints:
                continue

            if any(
                fingerprint
                == _quiz_fingerprint(
                    item["question"]
                )
                for item in generated
            ):
                continue

            generated.append(
                {
                    **candidate,
                    "fingerprint": fingerprint,
                }
            )

            excluded_fingerprints.add(
                fingerprint
            )

            if len(generated) >= num_questions:
                break

    return generated[:num_questions]


# ============================================================
# NORMAL CHAT
# ============================================================

def answer_query(
    query: str,
) -> str:

    wide = is_repeated_question_query(
        query
    )

    docs = get_user_context_docs(
        query,
        user_id=0,
        wide=wide,
    )

    context = "\n\n".join(
        doc.page_content
        for doc in docs
    )

    new_prompt = prompt.invoke(
        {
            "context": context,
            "question": query,
        }
    )

    response = llm.invoke(
        new_prompt
    )

    answer = response.content

    if (
        SENTINEL in answer
        or not context.strip()
    ):

        fb_prompt = fallback_prompt.invoke(
            {
                "question": query
            }
        )

        fb_response = llm.invoke(
            fb_prompt
        )

        return (
            f"{fb_response.content}"
            "\n\n(material needed )"
        )

    was_supplemented = (
        SUPPLEMENT_TAG in answer
    )

    answer = answer.replace(
        SUPPLEMENT_TAG,
        "",
    ).strip()

    suffix = (
        "\n\n(expanded beyond your source material)"
        if was_supplemented
        else ""
    )

    return (
        f"{answer}"
        f"{suffix}"
    )


# ============================================================
# CLI
# ============================================================

print(
    "RAG System Created"
)

print(
    "Press 0 to exit"
)


if __name__ == "__main__":

    while True:

        query = input(
            "You: "
        )

        if query == "0":
            break

        if (
            os.path.isfile(query)
            and query.lower().endswith(".pdf")
        ):

            print(
                "Reading PDF..."
            )

            try:

                basename = os.path.basename(
                    query
                )

                loader = PyPDFLoader(
                    query
                )

                pages = loader.load()

                if (
                    not pages
                    or not "".join(
                        page.page_content
                        for page in pages
                    ).strip()
                ):

                    print(
                        "Could not extract text."
                    )

                    continue

                for page in pages:

                    page.metadata["source"] = (
                        basename
                    )

                    page.metadata[
                        "source_lower"
                    ] = basename.lower()

                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1000,
                    chunk_overlap=200,
                )

                split_docs = (
                    splitter.split_documents(
                        pages
                    )
                )

                vectorStore.add_documents(
                    split_docs
                )

                label = register_source(
                    basename
                )

                print(
                    f"Success! Stored "
                    f"{len(split_docs)} chunks "
                    f"from '{basename}'. "
                    f"Label: {label}"
                )

            except Exception as e:

                print(
                    f"Error processing PDF: {e}"
                )

            continue

        if (
            os.path.isfile(query)
            and query.lower().endswith(
                (
                    ".png",
                    ".jpg",
                    ".jpeg",
                )
            )
        ):

            print(
                "Reading exam paper..."
            )

            try:

                basename = os.path.basename(
                    query
                )

                base64_image = encode_image(
                    query
                )

                message = HumanMessage(
                    content=[
                        {
                            "type": "text",
                            "text": (
                                "Carefully extract all text, "
                                "questions, formulas, and options "
                                "from this exam paper."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": (
                                    "data:image/jpeg;base64,"
                                    f"{base64_image}"
                                )
                            },
                        },
                    ]
                )

                vision_response = (
                    vision_llm.invoke(
                        [message]
                    )
                )

                extracted_text = (
                    vision_response.content
                )

                if len(
                    extracted_text.strip()
                ) < 15:

                    print(
                        "Could not extract useful text."
                    )

                    continue

                doc = Document(
                    page_content=extracted_text,
                    metadata={
                        "source": basename,
                        "source_lower": basename.lower(),
                    },
                )

                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1000,
                    chunk_overlap=200,
                )

                split_docs = (
                    splitter.split_documents(
                        [doc]
                    )
                )

                vectorStore.add_documents(
                    split_docs
                )

                label = register_source(
                    basename
                )

                print(
                    f"Success! Stored "
                    f"{len(split_docs)} chunks. "
                    f"Label: {label}"
                )

            except Exception as e:

                print(
                    f"Error processing image: {e}"
                )

            continue

        answer = answer_query(
            query
        )

        print(
            f"\nAI: {answer}"
        )