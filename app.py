import streamlit as st
import os
import tempfile
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Make sure to add vectorStore to your imports from main
from main import retriver, llm, prompt, vectorStore 

# --- Page Configuration ---
st.set_page_config(
    page_title="RAG Chat Assistant",
    page_icon="🤖",
    layout="centered"
)

# --- Sidebar: Document Upload ---
with st.sidebar:
    st.header("📄 Knowledge Base")
    st.caption("Upload additional PDFs to the database.")
    
    uploaded_file = st.file_uploader("Choose a PDF file", type=["pdf"])
    
    if uploaded_file is not None:
        if st.button("Process & Add to Database", use_container_width=True):
            with st.spinner("Embedding document..."):
                try:
                    # 1. Save uploaded file to a temporary location
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
                        tmp_file.write(uploaded_file.getvalue())
                        tmp_file_path = tmp_file.name
                    
                    # 2. Load the PDF
                    loader = PyPDFLoader(tmp_file_path)
                    documents = loader.load()
                    
                    # 3. Split the text into manageable chunks
                    text_splitter = RecursiveCharacterTextSplitter(
                        chunk_size=1000, 
                        chunk_overlap=200
                    )
                    chunks = text_splitter.split_documents(documents)
                    
                    # 4. Add chunks directly to the existing ChromaDB vector store
                    vectorStore.add_documents(chunks)
                    
                    # 5. Clean up the temporary file
                    os.remove(tmp_file_path)
                    
                    st.success(f"Successfully added **{uploaded_file.name}**!")
                    
                except Exception as e:
                    st.error(f"Error processing file: {str(e)}")

# --- Main UI Header ---
st.title("🤖 Custom RAG Assistant")
st.caption("Powered by MistralAI & ChromaDB")
st.markdown("---")

# --- Initialize Chat History ---
if "messages" not in st.session_state:
    st.session_state.messages = []

# --- Display Past Messages ---
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# --- Chat Input & Logic ---
if query := st.chat_input("Ask something about your documents..."):
    
    # Display User Message
    with st.chat_message("user"):
        st.markdown(query)
    st.session_state.messages.append({"role": "user", "content": query})

    # RAG Generation Pipeline
    with st.spinner("Searching documents and generating response..."):
        try:
            # Fetch relevant documents (this automatically queries the updated database)
            docs = retriver.invoke(query)
            
            # Combine context
            context = "\n\n".join([doc.page_content for doc in docs])
            
            # Format prompt
            new_prompt = prompt.invoke({
                "context": context,
                "question": query
            })
            
            # Get response from Mistral
            response = llm.invoke(new_prompt)
            ai_response = response.content
            
        except Exception as e:
            ai_response = f"⚠️ An error occurred: {str(e)}"

    # Display AI Response
    with st.chat_message("assistant"):
        st.markdown(ai_response)
    st.session_state.messages.append({"role": "assistant", "content": ai_response})