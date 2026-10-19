

from pathlib import Path
import chromadb
from chromadb.utils import embedding_functions


BASE_DIR = Path(__file__).resolve().parent
CHROMA_DIR = BASE_DIR / "chroma_db"
CHROMA_DIR.mkdir(parents=True, exist_ok=True)
_client = None
_collection = None

def get_coding_collection():
    global _client
    global _collection

    if _collection is not None:
        return _collection
    try:

        print("Initializing ChromaDB...")
        print(f"ChromaDB path: {CHROMA_DIR}")
        _client = chromadb.PersistentClient(
            path=str(CHROMA_DIR)
        )
        embedding_function = (
            embedding_functions.DefaultEmbeddingFunction()
        )
        _collection = _client.get_or_create_collection(
            name="coding_knowledge",
            embedding_function=embedding_function
        )

        print("==============================================")
        print("CHROMADB INITIALIZED SUCCESSFULLY")
        print("==============================================")
        print(f"Collection : {_collection.name}")
        print(f"Documents  : {_collection.count()}")
        print("==============================================")

        return _collection

    except Exception as e:

        print("==============================================")
        print("CHROMADB INITIALIZATION ERROR")
        print("==============================================")
        print(f"Error type : {type(e).__name__}")
        print(f"Error      : {e}")
        print("==============================================")

        _client = None
        _collection = None

        return None

def retrieve_coding_knowledge(
    query: str,
    language: str = "python",
    k: int = 4
):
    collection = get_coding_collection()

    if collection is None:
        return ""
    try:
        count = collection.count()
        if count == 0:

            print(
                "Coding knowledge collection is empty."
            )

            return ""

        k = min(k, count)

        search_query = (
            f"{language} programming: {query}"
        )

        print(
            f"Searching coding RAG: {search_query}"
        )

        results = collection.query(
            query_texts=[search_query],
            n_results=k
        )

        documents = results.get("documents", [])

        if not documents:
            return ""

        if not documents[0]:
            return ""

        return "\n\n---\n\n".join(
            documents[0]
        )

    except Exception as e:

        print("==============================================")
        print("RAG SEARCH ERROR")
        print("==============================================")
        print(f"Error: {e}")
        print("==============================================")

        return ""

if __name__ == "__main__":

    collection = get_coding_collection()

    if collection is None:

        print(
            "ChromaDB initialization failed."
        )

    else:

        print(
            f"\nTotal documents: "
            f"{collection.count()}"
        )

        result = retrieve_coding_knowledge(
            query="Python dictionary",
            language="python",
            k=4
        )

        print("\nRetrieved knowledge:")
        print("----------------------------------------------")
        print(result)