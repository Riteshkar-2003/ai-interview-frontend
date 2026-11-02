import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq


from pathlib import Path
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError(
        "GROQ_API_KEY is not found in .env file."
    )


def get_groq_model_name() -> str:
    """
    Returns the primary active Groq model configured for this account.
    Normalizes 'gpt-oss-120b' -> 'openai/gpt-oss-120b'.
    """
    raw = (os.getenv("MODEL_NAME") or "").strip()
    if raw.lower() == "gpt-oss-120b":
        return "openai/gpt-oss-120b"
    if raw.lower() == "gpt-oss-20b":
        return "openai/gpt-oss-20b"
    if raw:
        return raw
    return "openai/gpt-oss-120b"


model_name = get_groq_model_name()

llm = ChatGroq(
    model=model_name,
    temperature=0.7,
    api_key=groq_api_key
)


def invoke_llm_with_fallback(messages, temperature=0.7):
    """
    Invokes Groq with primary model and automatic fallback chain.
    """
    primary = get_groq_model_name()
    candidate_models = [
        primary,
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
        "llama-3.1-8b-instant",
        "llama3-8b-8192"
    ]
    candidate_models = list(dict.fromkeys([m for m in candidate_models if m]))

    last_err = None
    for m in candidate_models:
        try:
            chat = ChatGroq(
                model=m,
                temperature=temperature,
                api_key=groq_api_key
            )
            return chat.invoke(messages)
        except Exception as err:
            last_err = err
            print(f"[WARN] ChatGroq model '{m}' invocation failed: {err}")
            continue

    raise last_err or RuntimeError("All Groq LLM candidate models failed")