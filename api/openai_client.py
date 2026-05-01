import os
from openai import OpenAI
from dotenv import load_dotenv
from config.settings import MODEL_NAME, TEMPERATURE

load_dotenv()

_api_key = os.getenv("OPENAI_API_KEY")
if not _api_key:
    raise EnvironmentError("OPENAI_API_KEY is not set. Check your .env file.")

client = OpenAI(api_key=_api_key)


def generate_response(prompt_text):
    response = client.chat.completions.create(
        model=MODEL_NAME,
        temperature=TEMPERATURE,
        messages=[{"role": "user", "content": prompt_text}]
    )
    return response.choices[0].message.content