from pathlib import Path
import shutil
import chromadb
from chromadb.utils import embedding_functions

BASE_DIR = Path(__file__).resolve().parent
DOCUMENTS_DIR = BASE_DIR / "documents"
CHROMA_DIR = BASE_DIR / "chroma_db"

def chunk_text(text, chunk_size=800, chunk_overlap=150):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += (chunk_size - chunk_overlap)
    return chunks

def build_technical_vector_db():
    if not DOCUMENTS_DIR.exists():
        raise FileNotFoundError(f"Documents folder not found: {DOCUMENTS_DIR}")

    documents = []
    metadatas = []
    ids = []
    doc_count = 0

    emb_fn = embedding_functions.DefaultEmbeddingFunction()

  
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    
  
    try:
        client.delete_collection("technical_interview")
    except Exception:
        pass

    coll = client.create_collection("technical_interview", embedding_function=emb_fn)

    for file_path in DOCUMENTS_DIR.glob("*.txt"):
        text = file_path.read_text(encoding="utf-8").strip()
        if not text:
            continue
        skill = file_path.stem.lower()
        chunks = chunk_text(text, chunk_size=800, chunk_overlap=150)
        for idx, chunk in enumerate(chunks):
            doc_count += 1
            documents.append(chunk)
            metadatas.append({
                "skill": skill,
                "source": file_path.name,
                "type": "technical_interview",
                "chunk_idx": idx
            })
            ids.append(f"{file_path.stem}_{idx}_{doc_count}")

    if not documents:
        raise ValueError("No .txt documents found inside rag_technical/documents")

 
    batch_size = 50
    for i in range(0, len(documents), batch_size):
        coll.add(
            documents=documents[i:i+batch_size],
            metadatas=metadatas[i:i+batch_size],
            ids=ids[i:i+batch_size]
        )

    print(f"Technical ChromaDB created successfully! Total chunks: {len(documents)}")

if __name__ == "__main__":
    build_technical_vector_db()