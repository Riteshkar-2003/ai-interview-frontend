from pathlib import Path
import chromadb
from chromadb.utils import embedding_functions

BASE_DIR = Path(__file__).resolve().parent
CHROMA_DIR = BASE_DIR / "chroma_db"

_client = None
_collection = None

def get_technical_collection():
    global _client, _collection
    if _collection is not None:
        return _collection
    try:
        emb_fn = embedding_functions.DefaultEmbeddingFunction()
        _client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        _collection = _client.get_collection(
            name="technical_interview",
            embedding_function=emb_fn
        )
        return _collection
    except Exception as e:
        print(f"Warning: RAG technical collection initialization failed: {e}")
        return None

def retrieve_technical_knowledge(
    skills=None,
    difficulty="medium",
    query_text=None,
    top_k=4
):
    coll = get_technical_collection()
    if coll is None:
        return []

    try:
        search_terms = []
        if query_text:
            search_terms.append(str(query_text))
        if skills:
            if isinstance(skills, list):
                search_terms.append(", ".join(skills))
            else:
                search_terms.append(str(skills))
        if difficulty:
            search_terms.append(f"{difficulty} level technical interview questions and concepts")

        query = " | ".join(search_terms) if search_terms else "Technical interview concepts and questions"
        results = coll.query(
            query_texts=[query],
            n_results=top_k
        )

        docs = []
        if results and "documents" in results and results["documents"]:
            documents_list = results["documents"][0]
            metadatas_list = results.get("metadatas", [[]])[0]
            for idx, text in enumerate(documents_list):
                meta = metadatas_list[idx] if idx < len(metadatas_list) else {}
                docs.append({
                    "content": text,
                    "metadata": meta
                })
        return docs
    except Exception as e:
        print(f"Error during technical knowledge retrieval: {e}")
        return []

def get_rag_context(
    skills=None,
    difficulty="medium",
    query_text=None,
    top_k=4
):
    documents = retrieve_technical_knowledge(
        skills=skills,
        difficulty=difficulty,
        query_text=query_text,
        top_k=top_k
    )

    if not documents:
        return ""

    context_parts = []
    for doc in documents:
        skill = doc["metadata"].get("skill", "General")
        src = doc["metadata"].get("source", "Knowledge Base")
        content = doc["content"]
        context_parts.append(
            f"=== TOPIC: {skill.upper()} (Source: {src}) ===\n{content}"
        )

    return "\n\n".join(context_parts)

def retrieve_answer_analysis_knowledge(
    question: str,
    candidate_answer: str,
    top_k: int = 4
) -> str:
    """
    Retrieves ground-truth technical knowledge matching the question and candidate answer
    to evaluate technical correctness and identify missing points.
    """
    coll = get_technical_collection()
    if coll is None:
        return ""

    try:
        query = f"Interview Question: {question}\nKey Technical Concepts and Answers for: {candidate_answer[:200]}"
        results = coll.query(
            query_texts=[query],
            n_results=top_k
        )
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            return "\n\n---\n\n".join(docs)
        return ""
    except Exception as e:
        print(f"Error retrieving answer analysis knowledge: {e}")
        return ""