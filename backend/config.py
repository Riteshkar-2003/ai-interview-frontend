import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq


load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError(
        "GROQ_API_KEY is not found in .env file."
    )


llm = ChatGroq(
    model=os.getenv("MODEL_NAME"),
    temperature=0.7,
    api_key=groq_api_key
)