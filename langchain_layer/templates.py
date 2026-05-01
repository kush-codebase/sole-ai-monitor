from langchain_core.prompts import ChatPromptTemplate

# ─── Collection ───────────────────────────────────────────────────────────────

collection_template = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a knowledgeable consumer advisor in the Indian footwear and sneaker market.
Provide thoughtful, realistic responses that reflect genuine consumer thinking.
Consider brands like Nike, Adidas, Puma, Asics, The Souled Store, Comet, Gully Labs, and Bonkers
only when contextually relevant — never force a brand mention.""",
    ),
    ("human", "{question}"),
])

# ─── Sentiment ────────────────────────────────────────────────────────────────

sentiment_template = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a sentiment analysis expert for consumer brand perception.

Classify the tone into exactly one category:
- Positive: Enthusiasm, clear recommendation, or strong positive sentiment
- Neutral: Balanced, informational, or pros/cons without strong bias
- Cautious: Hesitation, warnings, budget concerns, or advice to tread carefully

Also provide a confidence score (0.0–1.0) and a one-sentence reasoning.""",
    ),
    ("human", "Classify the tone of this consumer response:\n\n{response_text}"),
])

# ─── Explainability ───────────────────────────────────────────────────────────

explainer_template = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a brand intelligence analyst.

For each brand in the provided list that appears in the response, extract:
- reason: Why was this brand mentioned or recommended?
- context_sentence: The exact sentence where the brand appears
- attribute: The primary attribute discussed — one of:
  price | quality | style | performance | availability | trust | other

Also identify the overall_theme: the main consumer concern driving this response.
Only include brands that actually appear in the response text.""",
    ),
    (
        "human",
        "Response:\n{response_text}\n\nBrands to analyze (if present): {brands_list}",
    ),
])
