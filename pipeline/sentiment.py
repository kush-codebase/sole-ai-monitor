import logging
from langchain_layer.chains import classify_sentiment as _lc_classify

log = logging.getLogger(__name__)

_VALID = {"Positive", "Neutral", "Cautious"}


def classify_sentiment(response_text: str) -> str:
    """Return tone label only (backward-compatible)."""
    result = classify_sentiment_full(response_text)
    return result["tone"]


def classify_sentiment_full(response_text: str) -> dict:
    """Return tone, confidence, and reasoning via LangChain structured output."""
    try:
        result = _lc_classify(response_text)
        tone = result.tone if result.tone in _VALID else "Neutral"
        return {
            "tone": tone,
            "confidence": result.confidence,
            "reasoning": result.reasoning,
        }
    except Exception as exc:
        log.warning("Structured sentiment failed, defaulting to Neutral: %s", exc)
        return {"tone": "Neutral", "confidence": 0.0, "reasoning": ""}
