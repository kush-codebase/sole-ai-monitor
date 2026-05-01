from typing import Literal, List
from pydantic import BaseModel, Field


class SentimentResult(BaseModel):
    tone: Literal["Positive", "Neutral", "Cautious"] = Field(
        description="The tone classification"
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Confidence score between 0 and 1"
    )
    reasoning: str = Field(
        description="One sentence explaining the classification"
    )


class BrandContext(BaseModel):
    brand: str = Field(description="Brand name as it appears in the brands list")
    reason: str = Field(description="Why this brand was mentioned or recommended")
    context_sentence: str = Field(description="The exact sentence where the brand appears")
    attribute: Literal["price", "quality", "style", "performance", "availability", "trust", "other"] = Field(
        description="Primary attribute being discussed"
    )


class ExplainabilityResult(BaseModel):
    brands: List[BrandContext] = Field(
        description="Context for each brand found in the response"
    )
    overall_theme: str = Field(
        description="The main consumer concern or theme driving this response"
    )
