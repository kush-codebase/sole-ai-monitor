import os
from dotenv import load_dotenv
load_dotenv()
from langchain_openai import ChatOpenAI
from .templates import collection_template, sentiment_template, explainer_template
from .parsers import SentimentResult, ExplainabilityResult

_llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.7,
    api_key=os.getenv("OPENAI_API_KEY"),
)

_llm_structured = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.0,
    api_key=os.getenv("OPENAI_API_KEY"),
)

# ─── Collection chain ─────────────────────────────────────────────────────────

collection_chain = collection_template | _llm

def collect_response(question: str) -> str:
    return collection_chain.invoke({"question": question}).content


# ─── Sentiment chain ──────────────────────────────────────────────────────────

sentiment_chain = sentiment_template | _llm_structured.with_structured_output(SentimentResult)

def classify_sentiment(response_text: str) -> SentimentResult:
    return sentiment_chain.invoke({"response_text": response_text})


# ─── Explainability chain ─────────────────────────────────────────────────────

explainer_chain = explainer_template | _llm_structured.with_structured_output(ExplainabilityResult)

def explain_brands(response_text: str, brands_list: list[str]) -> ExplainabilityResult:
    return explainer_chain.invoke({
        "response_text": response_text,
        "brands_list": ", ".join(brands_list),
    })
