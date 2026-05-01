from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from db.database import Base


class Run(Base):
    __tablename__ = "runs"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    created_at      = Column(DateTime, default=datetime.utcnow, nullable=False)
    model           = Column(String(64), nullable=False)
    temperature     = Column(Float, nullable=False)
    prompts_count   = Column(Integer, nullable=False)
    responses_count = Column(Integer, default=0)
    notes           = Column(Text)

    responses = relationship("Response", back_populates="run", cascade="all, delete-orphan")


class Response(Base):
    __tablename__ = "responses"

    id                   = Column(Integer, primary_key=True, autoincrement=True)
    run_id               = Column(Integer, ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    prompt_id            = Column(Integer, nullable=False)
    prompt_text          = Column(Text, nullable=False)
    stage                = Column(String(64), nullable=False)
    run_number           = Column(Integer, nullable=False)
    response             = Column(Text, nullable=False)
    tone                 = Column(String(32))
    timestamp            = Column(DateTime)
    # GenAI enrichment columns
    sentiment_confidence = Column(Float)
    sentiment_reasoning  = Column(Text)
    embedding            = Column(Text)   # JSON-serialised float list
    cluster_id           = Column(Integer)

    run          = relationship("Run", back_populates="responses")
    explanations = relationship("Explanation", back_populates="response", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_resp_run_id",    "run_id"),
        Index("idx_resp_stage",     "stage"),
        Index("idx_resp_tone",      "tone"),
        Index("idx_resp_stage_run", "stage", "run_id"),
        Index("idx_resp_prompt",    "prompt_id"),
        Index("idx_resp_cluster",   "cluster_id"),
    )


class Explanation(Base):
    __tablename__ = "explanations"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    response_id      = Column(Integer, ForeignKey("responses.id", ondelete="CASCADE"), nullable=False)
    brand            = Column(String(128), nullable=False)
    reason           = Column(Text)
    context_sentence = Column(Text)
    attribute        = Column(String(32))
    overall_theme    = Column(Text)

    response = relationship("Response", back_populates="explanations")

    __table_args__ = (
        Index("idx_expl_response_id", "response_id"),
        Index("idx_expl_brand",       "brand"),
    )
