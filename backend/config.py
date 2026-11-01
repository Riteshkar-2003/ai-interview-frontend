import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq


load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError(
        "GROQ_API_KEY is not found in .env file."
    )


def get_groq_model_name() -> str:
    """
    Returns a guaranteed valid Groq model name.
    If MODEL_NAME is unset or contains OpenAI / deprecated identifiers
    like 'openai/gpt-oss-120b', automatically falls back to 'llama-3.3-70b-versatile'.
    """
    raw = (os.getenv("MODEL_NAME") or "").strip()
    if not raw or "gpt-oss" in raw.lower() or raw.lower().startswith("openai/") or "120b" in raw.lower():
        return "llama-3.3-70b-versatile"
    return raw


model_name = get_groq_model_name()

llm = ChatGroq(
    model=model_name,
    temperature=0.7,
    api_key=groq_api_key
)
