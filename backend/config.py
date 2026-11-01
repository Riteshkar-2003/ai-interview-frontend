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
    Returns an active, universally supported Groq model.
    'llama-3.1-8b-instant' is available on all Groq tiers (free and paid).
    """
    raw = (os.getenv("MODEL_NAME") or "").strip()
    if (
        not raw
        or "gpt-oss" in raw.lower()
        or raw.lower().startswith("openai/")
        or "120b" in raw.lower()
        or "llama-3.3-70b" in raw.lower()
        or "70b" in raw.lower()
    ):
        return "llama-3.1-8b-instant"
    return raw


model_name = get_groq_model_name()

llm = ChatGroq(
    model=model_name,
    temperature=0.7,
    api_key=groq_api_key
)


def invoke_llm_with_fallback(messages, temperature=0.7):
    """
    Invokes Groq with primary model ('llama-3.1-8b-instant').
    If rate-limited or unavailable, seamlessly tries backup models.
    """
    candidate_models = [get_groq_model_name(), "llama-3.1-8b-instant", "llama3-8b-8192"]
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
