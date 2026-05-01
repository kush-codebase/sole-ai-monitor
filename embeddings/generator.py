"""Batch OpenAI embeddings generator — stores vectors in DB."""
import logging
import os
from dotenv import load_dotenv
load_dotenv()
from openai import OpenAI
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import Response
from config.settings import EMBEDDING_MODEL

log = logging.getLogger(__name__)
BATCH_SIZE = 100

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _embed_batch(texts: list[str]) -> list[list[float]]:
    resp = _client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [item.embedding for item in sorted(resp.data, key=lambda x: x.index)]


def generate_missing(run_id: int | None = None) -> int:
    """Embed all responses that have no embedding stored yet."""
    db: Session = SessionLocal()
    embedded = 0
    try:
        query = db.query(Response).filter(Response.embedding.is_(None))
        if run_id is not None:
            query = query.filter(Response.run_id == run_id)
        rows = query.all()

        for i in range(0, len(rows), BATCH_SIZE):
            batch = rows[i : i + BATCH_SIZE]
            texts = [r.response for r in batch]
            try:
                vectors = _embed_batch(texts)
                for row, vec in zip(batch, vectors):
                    import json
                    row.embedding = json.dumps(vec)
                db.commit()
                embedded += len(batch)
            except Exception as exc:
                db.rollback()
                log.warning("Embedding batch %d failed: %s", i // BATCH_SIZE, exc)
    finally:
        db.close()

    log.info("Embedded %d responses.", embedded)
    return embedded
