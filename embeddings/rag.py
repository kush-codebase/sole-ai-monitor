"""ChromaDB RAG layer — semantic search over stored responses."""
import json
import logging
import os
from dotenv import load_dotenv
load_dotenv()
import chromadb
from chromadb.config import Settings
from openai import OpenAI
from db.database import SessionLocal
from db.models import Response
from config.settings import EMBEDDING_MODEL

log = logging.getLogger(__name__)

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "chroma_store")
COLLECTION_NAME = "sole_responses"

_openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
_chroma = chromadb.PersistentClient(
    path=CHROMA_PATH,
    settings=Settings(anonymized_telemetry=False),
)


def _get_collection():
    return _chroma.get_or_create_collection(COLLECTION_NAME)


def index_responses(run_id: int | None = None) -> int:
    """Push embedded responses into ChromaDB (idempotent via upsert)."""
    db = SessionLocal()
    indexed = 0
    try:
        col = _get_collection()
        query = db.query(Response).filter(Response.embedding.isnot(None))
        if run_id is not None:
            query = query.filter(Response.run_id == run_id)
        rows = query.all()

        ids, embeddings, docs, metas = [], [], [], []
        for row in rows:
            ids.append(str(row.id))
            embeddings.append(json.loads(row.embedding))
            docs.append(row.response)
            metas.append({
                "stage": row.stage or "",
                "tone": row.tone or "",
                "prompt_id": row.prompt_id or "",
                "run_id": row.run_id,
            })

        if ids:
            col.upsert(ids=ids, embeddings=embeddings, documents=docs, metadatas=metas)
            indexed = len(ids)
    finally:
        db.close()

    log.info("Indexed %d responses into ChromaDB.", indexed)
    return indexed


def semantic_search(query: str, n_results: int = 5, stage: str | None = None) -> list[dict]:
    """Return top-N semantically similar responses to a natural-language query."""
    resp = _openai.embeddings.create(model=EMBEDDING_MODEL, input=[query])
    query_vec = resp.data[0].embedding

    col = _get_collection()
    if col.count() == 0:
        return []

    where = {"stage": stage} if stage else None
    results = col.query(
        query_embeddings=[query_vec],
        n_results=min(n_results, col.count()),
        where=where,
        include=["documents", "metadatas", "distances"],
    )

    hits = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        hits.append({
            "response": doc,
            "stage": meta.get("stage"),
            "tone": meta.get("tone"),
            "run_id": meta.get("run_id"),
            "similarity": round(1 - dist, 4),
        })
    return hits
