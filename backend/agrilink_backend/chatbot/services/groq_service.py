from openai import OpenAI
import os

from dotenv import load_dotenv
from .document_loader import load_project_context

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

# LOAD PROJECT CONTEXT
try:
    context = load_project_context()

except Exception as e:

    print("CONTEXT ERROR:", str(e))

    context = "No project context available."


def ask_gemini(message):

    try:

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": f"""
                    You are AgriLink Coffee Hub assistant.

                    Use ONLY the following project information
                    to answer questions.

                    {context}

                    If the question is unrelated,
                    say:
                    "I can only assist with AgriLink Coffee Hub."
                    """
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            temperature=0.7,
            max_tokens=1024
        )

        return response.choices[0].message.content

    except Exception as e:

        print("GROQ ERROR:", str(e))

        return f"GROQ ERROR: {str(e)}"