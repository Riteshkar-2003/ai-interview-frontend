import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq


load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError(
        "GROQ_API_KEY is not found in .env file."
    )


# Valid Groq model — "llama-3.3-70b-versatile" is the recommended default.
# Override via MODEL_NAME env var if needed.
model_name = os.getenv("MODEL_NAME") or "llama-3.3-70b-versatile"

llm = ChatGroq(
    model=model_name,
    temperature=0.7,
    api_key=groq_api_key
)
